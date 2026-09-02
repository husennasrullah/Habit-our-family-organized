package storage

import (
	"context"
	"io"
	"time"
)

// Storage adalah interface untuk semua operasi object storage.
// Implementasi bisa berupa MinIO, Cloudflare R2, AWS S3, atau apapun
// yang S3-compatible — cukup buat struct baru yang implement interface ini
// dan inject via NewClient().
type Storage interface {
	// Upload menyimpan file ke object storage dan mengembalikan object key.
	Upload(ctx context.Context, key, contentType string, r io.Reader, size int64) (objectKey string, err error)

	// Delete menghapus file dari object storage berdasarkan key.
	Delete(ctx context.Context, key string) error

	// PresignedURL mengembalikan URL sementara yang bisa diakses publik.
	PresignedURL(ctx context.Context, key string, expiry time.Duration) (url string, err error)

	// PublicURL mengembalikan URL permanen (hanya cocok jika bucket public).
	PublicURL(key string) string

	// GetObject mengembalikan stream file langsung dari storage.
	// Gunakan untuk proxy — hindari expose endpoint MinIO ke publik.
	GetObject(ctx context.Context, key string) (io.ReadCloser, string, int64, error)
}
