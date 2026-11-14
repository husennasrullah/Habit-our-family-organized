package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/url"
	"strings"
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

var errStorageUnavailable = errors.New("storage tidak tersedia; periksa konfigurasi provider dan koneksi object storage")

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

// NewClient selects an S3-compatible backend without changing consuming services.
// Cloud buckets are provisioned separately unless explicitly enabled by env.
func NewClient(cfg *config.StorageConfig) (Storage, error) {
	if cfg == nil {
		return nil, errors.New("konfigurasi storage wajib diisi")
	}
	provider := strings.ToLower(strings.TrimSpace(cfg.Provider))
	if provider == "" {
		provider = "minio"
	}
	if provider == "disabled" {
		return &noopStorage{}, nil
	}
	switch provider {
	case "minio", "s3", "r2":
	default:
		return nil, errors.New("STORAGE_PROVIDER harus minio, s3, r2, atau disabled")
	}
	endpoint := strings.TrimSpace(cfg.Endpoint)
	secure := cfg.UseSSL
	if strings.Contains(endpoint, "://") {
		u, err := url.Parse(endpoint)
		if err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.User != nil || u.RawQuery != "" || u.Fragment != "" || (u.Path != "" && u.Path != "/") {
			return nil, errors.New("STORAGE_ENDPOINT harus host[:port] atau URL HTTP(S) tanpa path/credentials")
		}
		endpoint, secure = u.Host, u.Scheme == "https"
	}
	if endpoint == "" || cfg.Bucket == "" || cfg.AccessKey == "" || cfg.SecretKey == "" {
		return nil, errors.New("endpoint, bucket dan credentials storage wajib diisi")
	}
	region := cfg.Region
	if region == "" && provider == "r2" {
		region = "auto"
	}
	lookup := minio.BucketLookupAuto
	switch cfg.AddressingStyle {
	case "", "auto":
	case "path":
		lookup = minio.BucketLookupPath
	case "virtual":
		lookup = minio.BucketLookupDNS
	default:
		return nil, errors.New("STORAGE_ADDRESSING_STYLE harus auto, path, atau virtual")
	}
	if cfg.PublicURL != "" {
		u, err := url.Parse(cfg.PublicURL)
		if err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
			return nil, errors.New("STORAGE_PUBLIC_URL tidak valid")
		}
	}
	mc, err := minio.New(endpoint, &minio.Options{Creds: credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, cfg.SessionToken), Secure: secure, Region: region, BucketLookup: lookup})
	if err != nil {
		return nil, errors.New("STORAGE_ENDPOINT tidak valid")
	}
	if cfg.AutoCreateBucket {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		exists, err := mc.BucketExists(ctx, cfg.Bucket)
		if err != nil {
			return nil, errors.New("bucket storage tidak dapat diperiksa; periksa koneksi dan izin")
		}
		if !exists {
			if err := mc.MakeBucket(ctx, cfg.Bucket, minio.MakeBucketOptions{Region: region}); err != nil {
				return nil, errors.New("bucket storage gagal dibuat; buat bucket atau periksa izin")
			}
		}
	}
	log.Printf("storage: provider=%s configured (ssl=%v)", provider, secure)
	return &minioStorage{client: mc, bucket: cfg.Bucket, publicURL: strings.TrimRight(cfg.PublicURL, "/")}, nil
}

// NewMinIOStorage is retained for existing callers.
func NewMinIOStorage(cfg *config.StorageConfig) Storage {
	client, err := NewClient(cfg)
	if err != nil {
		log.Printf("storage: %v", err)
		return &noopStorage{}
	}
	return client
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
		contentType = "application/octet-stream"
	}
	return obj, contentType, info.Size, nil
}
