package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"time"

	"keluarga-app/backend/internal/config"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// minioStorage mengimplementasikan interface Storage menggunakan MinIO SDK.
// MinIO SDK juga kompatibel dengan Cloudflare R2 dan AWS S3 —
// cukup ganti endpoint + credentials di .env.
type minioStorage struct {
	client    *minio.Client
	bucket    string
	publicURL string // base URL untuk akses publik, kosong = pakai presigned URL
}

// noopStorage adalah fallback ketika MinIO tidak tersedia.
// Semua operasi upload/delete/serve mengembalikan error 503.
// Backend tetap berjalan normal; hanya fitur foto & dokumen yang nonaktif.
type noopStorage struct{}

var errStorageUnavailable = errors.New("storage tidak tersedia: MinIO belum dikonfigurasi atau tidak dapat dijangkau. Jalankan MinIO atau set STORAGE_ENDPOINT yang valid")

func (n *noopStorage) Upload(_ context.Context, _, _ string, _ io.Reader, _ int64) (string, error) {
	return "", errStorageUnavailable
}
func (n *noopStorage) Delete(_ context.Context, _ string) error { return errStorageUnavailable }
func (n *noopStorage) PresignedURL(_ context.Context, _ string, _ time.Duration) (string, error) {
	return "", errStorageUnavailable
}
func (n *noopStorage) PublicURL(_ string) string { return "" }
func (n *noopStorage) GetObject(_ context.Context, _ string) (io.ReadCloser, string, int64, error) {
	return nil, "", 0, errStorageUnavailable
}

// NewMinIOStorage membuat instance storage yang terhubung ke MinIO / R2 / S3.
// Jika koneksi gagal (MinIO tidak jalan), mengembalikan noopStorage agar
// backend tetap bisa start — fitur upload foto/dokumen akan return error 503.
func NewMinIOStorage(cfg *config.StorageConfig) Storage {
	mc, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		log.Printf("⚠️  storage: failed to init client (%v) — upload/dokumen dinonaktifkan", err)
		return &noopStorage{}
	}

	// Cek koneksi ke bucket (akan gagal jika MinIO tidak jalan)
	ctx := context.Background()
	exists, err := mc.BucketExists(ctx, cfg.Bucket)
	if err != nil {
		log.Printf("⚠️  storage: cannot reach MinIO at %s (%v) — upload/dokumen dinonaktifkan", cfg.Endpoint, err)
		return &noopStorage{}
	}
	if !exists {
		if err := mc.MakeBucket(ctx, cfg.Bucket, minio.MakeBucketOptions{}); err != nil {
			log.Printf("⚠️  storage: failed to create bucket '%s' (%v) — upload/dokumen dinonaktifkan", cfg.Bucket, err)
			return &noopStorage{}
		}
		log.Printf("storage: bucket '%s' created", cfg.Bucket)
	}

	log.Printf("✅ storage: connected (endpoint=%s, bucket=%s, ssl=%v)", cfg.Endpoint, cfg.Bucket, cfg.UseSSL)
	return &minioStorage{
		client:    mc,
		bucket:    cfg.Bucket,
		publicURL: cfg.PublicURL,
	}
}

// Upload menyimpan file dan mengembalikan object key (bukan full URL).
// Simpan key ini ke database; gunakan PresignedURL atau PublicURL saat serving.
func (s *minioStorage) Upload(ctx context.Context, key, contentType string, r io.Reader, size int64) (string, error) {
	_, err := s.client.PutObject(ctx, s.bucket, key, r, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("storage: upload '%s' failed: %w", key, err)
	}
	return key, nil
}

// Delete menghapus object dari storage berdasarkan key.
func (s *minioStorage) Delete(ctx context.Context, key string) error {
	return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}

// PresignedURL menghasilkan URL sementara yang valid selama expiry.
// Gunakan untuk foto yang private (default untuk project ini).
func (s *minioStorage) PresignedURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	u, err := s.client.PresignedGetObject(ctx, s.bucket, key, expiry, nil)
	if err != nil {
		return "", fmt.Errorf("storage: presign '%s' failed: %w", key, err)
	}
	return u.String(), nil
}

// PublicURL mengembalikan URL permanen.
// Hanya dipakai jika STORAGE_PUBLIC_URL di-set (bucket public / custom domain R2).
func (s *minioStorage) PublicURL(key string) string {
	if s.publicURL != "" {
		return fmt.Sprintf("%s/%s", s.publicURL, key)
	}
	return ""
}

// GetObject mengambil file dari MinIO dan mengembalikan stream-nya.
// Dipakai oleh ServePhoto handler untuk proxy foto ke browser.
func (s *minioStorage) GetObject(ctx context.Context, key string) (io.ReadCloser, string, int64, error) {
	if ctx == nil {
		ctx = context.Background()
	}
	obj, err := s.client.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, "", 0, fmt.Errorf("storage: get '%s' failed: %w", key, err)
	}
	info, err := obj.Stat()
	if err != nil {
		obj.Close()
		return nil, "", 0, fmt.Errorf("storage: stat '%s' failed: %w", key, err)
	}
	contentType := info.ContentType
	if contentType == "" {
		contentType = "image/jpeg"
	}
	return obj, contentType, info.Size, nil
}
