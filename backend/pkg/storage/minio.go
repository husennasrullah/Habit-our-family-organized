package storage

import (
	"context"
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

// NewMinIOStorage membuat instance storage yang terhubung ke MinIO / R2 / S3.
// Dipanggil dari main.go dan di-inject ke service sebagai interface Storage.
func NewMinIOStorage(cfg *config.StorageConfig) Storage {
	mc, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		log.Fatalf("storage: failed to init client: %v", err)
	}

	// Auto-create bucket jika belum ada (hanya berlaku untuk MinIO dev)
	ctx := context.Background()
	exists, err := mc.BucketExists(ctx, cfg.Bucket)
	if err != nil {
		log.Fatalf("storage: failed to check bucket: %v", err)
	}
	if !exists {
		if err := mc.MakeBucket(ctx, cfg.Bucket, minio.MakeBucketOptions{}); err != nil {
			log.Fatalf("storage: failed to create bucket '%s': %v", cfg.Bucket, err)
		}
		log.Printf("storage: bucket '%s' created", cfg.Bucket)
	}

	log.Printf("storage: connected (endpoint=%s, bucket=%s, ssl=%v)", cfg.Endpoint, cfg.Bucket, cfg.UseSSL)
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
func (s *minioStorage) GetObject(ctx context.Context, key string) (io.ReadCloser, string, error) {
	if ctx == nil {
		ctx = context.Background()
	}
	obj, err := s.client.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, "", fmt.Errorf("storage: get '%s' failed: %w", key, err)
	}
	info, err := obj.Stat()
	if err != nil {
		obj.Close()
		return nil, "", fmt.Errorf("storage: stat '%s' failed: %w", key, err)
	}
	contentType := info.ContentType
	if contentType == "" {
		contentType = "image/jpeg"
	}
	return obj, contentType, nil
}
