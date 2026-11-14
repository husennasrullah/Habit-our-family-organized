package storage

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/url"
	"strings"
	"sync"
	"syscall"
	"time"

	"keluarga-app/backend/internal/config"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// minioStorage mengimplementasikan interface Storage menggunakan MinIO SDK.
// MinIO SDK juga kompatibel dengan Cloudflare R2 dan AWS S3 —
// cukup ganti endpoint + credentials di .env.
type minioStorage struct {
	client          *minio.Client
	bucket          string
	publicURL       string // base URL untuk akses publik, kosong = pakai presigned URL
	region          string
	autoCreate      bool
	bucketMu        sync.Mutex
	bucketReady     bool
	nextBucketCheck time.Time
	probeTimeout    time.Duration
	retryInterval   time.Duration
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
	client := &minioStorage{client: mc, bucket: cfg.Bucket, publicURL: strings.TrimRight(cfg.PublicURL, "/"), region: region, autoCreate: cfg.AutoCreateBucket, probeTimeout: 2 * time.Second, retryInterval: 10 * time.Second}
	if cfg.AutoCreateBucket {
		_ = client.ensureBucket(context.Background())
	}
	log.Printf("storage: provider=%s configured (ssl=%v); storage failures do not stop the API", provider, secure)
	return client, nil
}

// NewClientOrDisabled keeps every storage failure isolated to file features.
func NewClientOrDisabled(cfg *config.StorageConfig) Storage {
	client, err := NewClient(cfg)
	if err != nil {
		log.Printf("storage: file features disabled: %v; API remains available", err)
		return &noopStorage{}
	}
	return client
}

// Safe diagnostics retain actionable error categories without URLs, credentials or response bodies.
func storageFailureReason(err error) string {
	if errors.Is(err, syscall.ECONNREFUSED) {
		return "connection_refused"
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return "timeout"
	}
	var dns *net.DNSError
	if errors.As(err, &dns) {
		return "dns_lookup_failed"
	}
	var cert x509.UnknownAuthorityError
	if errors.As(err, &cert) {
		return "tls_unknown_authority"
	}
	var invalidCert x509.CertificateInvalidError
	if errors.As(err, &invalidCert) {
		return "tls_certificate_invalid"
	}
	var hostCert x509.HostnameError
	if errors.As(err, &hostCert) {
		return "tls_hostname_mismatch"
	}
	var record tls.RecordHeaderError
	if errors.As(err, &record) {
		return "tls_protocol_mismatch"
	}
	response := minio.ToErrorResponse(err)
	if response.Code != "" {
		code := response.Code
		if len(code) > 64 {
			return "provider_error"
		}
		for _, c := range code {
			if !(c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c == '_' || c == '-') {
				return "provider_error"
			}
		}
		return fmt.Sprintf("s3_code=%s http_status=%d", code, response.StatusCode)
	}
	var network net.Error
	if errors.As(err, &network) {
		if network.Timeout() {
			return "network_timeout"
		}
		return "network_connection_failed"
	}
	return "storage_request_failed"
}
func (s *minioStorage) ensureBucket(parent context.Context) error {
	if !s.autoCreate {
		return nil
	}
	s.bucketMu.Lock()
	defer s.bucketMu.Unlock()
	if s.bucketReady {
		return nil
	}
	if time.Now().Before(s.nextBucketCheck) {
		return errStorageUnavailable
	}
	ctx, cancel := context.WithTimeout(parent, s.probeTimeout)
	defer cancel()
	exists, err := s.client.BucketExists(ctx, s.bucket)
	operation := "check_bucket"
	if err == nil && !exists {
		operation = "create_bucket"
		err = s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{Region: s.region})
		if code := minio.ToErrorResponse(err).Code; code == "BucketAlreadyOwnedByYou" {
			err = nil
		}
	}
	if err != nil {
		s.nextBucketCheck = time.Now().Add(s.retryInterval)
		log.Printf("storage: %s unavailable (%s); file operation disabled, retry after %s; API remains available", operation, storageFailureReason(err), s.retryInterval)
		return errStorageUnavailable
	}
	s.bucketReady = true
	s.nextBucketCheck = time.Time{}
	log.Printf("storage: bucket ready; file operations available")
	return nil
}

// NewMinIOStorage is retained for existing callers.
func NewMinIOStorage(cfg *config.StorageConfig) Storage { return NewClientOrDisabled(cfg) }

// Upload menyimpan file dan mengembalikan object key (bukan full URL).
// Simpan key ini ke database; gunakan PresignedURL atau PublicURL saat serving.
func (s *minioStorage) Upload(ctx context.Context, key, contentType string, r io.Reader, size int64) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	if err := s.ensureBucket(ctx); err != nil {
		return "", err
	}
	_, err := s.client.PutObject(ctx, s.bucket, key, r, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		if s.autoCreate {
			s.bucketMu.Lock()
			s.bucketReady = false
			s.nextBucketCheck = time.Now().Add(s.retryInterval)
			s.bucketMu.Unlock()
		}
		log.Printf("storage: upload failed (%s); API remains available", storageFailureReason(err))
		return "", errStorageUnavailable
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
