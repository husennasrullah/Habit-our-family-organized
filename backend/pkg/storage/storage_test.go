package storage

import (
	"bytes"
	"context"
	"errors"
	"github.com/minio/minio-go/v7"
	"io"
	"keluarga-app/backend/internal/config"
	"log"
	"net"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"net/url"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestProviderValidation(t *testing.T) {
	for _, cfg := range []config.StorageConfig{{Provider: "azure"}, {Provider: "s3"}, {Provider: "s3", Endpoint: "https://user:secret@example.com", Bucket: "test", AccessKey: "a", SecretKey: "b"}, {Provider: "s3", Endpoint: "https://example.com/path", Bucket: "test", AccessKey: "a", SecretKey: "b"}, {Provider: "s3", Endpoint: "example.com", Bucket: "test", AccessKey: "a", SecretKey: "b", AddressingStyle: "wrong"}} {
		if _, err := NewClient(&cfg); err == nil {
			t.Errorf("invalid configuration accepted: provider=%s", cfg.Provider)
		}
	}
	s, err := NewClient(&config.StorageConfig{Provider: "disabled"})
	if err != nil {
		t.Fatal(err)
	}
	if _, err = s.PresignedURL(context.Background(), "file", time.Minute); err == nil {
		t.Fatal("disabled provider signed URL")
	}
}
func TestS3CompatibleOperations(t *testing.T) {
	var data []byte
	created := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") == "" {
			t.Error("missing signature")
		}
		switch r.Method {
		case "HEAD":
			if !created {
				w.WriteHeader(404)
				return
			}
			w.Header().Set("Content-Type", "application/pdf")
			w.Header().Set("Content-Length", "9")
			w.Header().Set("ETag", "\"test\"")
			w.Header().Set("Last-Modified", time.Now().UTC().Format(http.TimeFormat))
		case "PUT":
			if strings.TrimRight(r.URL.Path, "/") == "/family" {
				created = true
				w.WriteHeader(200)
				return
			}
			var reader io.Reader = r.Body
			if strings.Contains(r.Header.Get("Content-Encoding"), "aws-chunked") {
				reader = httputil.NewChunkedReader(r.Body)
			}
			data, _ = io.ReadAll(reader)
			w.Header().Set("ETag", "\"test\"")
		case "GET":
			w.Header().Set("Content-Type", "application/pdf")
			w.Header().Set("Last-Modified", time.Now().UTC().Format(http.TimeFormat))
			w.Header().Set("ETag", "\"test\"")
			_, _ = w.Write(data)
		case "DELETE":
			data = nil
			w.WriteHeader(204)
		default:
			t.Errorf("unexpected request %s", r.Method)
		}
	}))
	defer server.Close()
	for _, provider := range []string{"minio", "s3", "r2"} {
		t.Run(provider, func(t *testing.T) {
			cfg := &config.StorageConfig{Provider: provider, Endpoint: server.URL, AccessKey: "key", SecretKey: "secret", Bucket: "family", Region: "us-east-1", SessionToken: "temporary-test-token", UseSSL: true, AddressingStyle: "path", AutoCreateBucket: provider == "minio"}
			s, err := NewClient(cfg)
			if err != nil {
				t.Fatal(err)
			}
			if _, err = s.Upload(context.Background(), "file.pdf", "application/pdf", strings.NewReader("%PDF-test"), 9); err != nil {
				t.Fatal(err)
			}
			r, ct, _, err := s.GetObject(context.Background(), "file.pdf")
			if err != nil {
				t.Fatal(err)
			}
			got, _ := io.ReadAll(r)
			r.Close()
			if string(got) != "%PDF-test" || ct != "application/pdf" {
				t.Fatalf("read mismatch: %q content-type %q", got, ct)
			}
			signed, err := s.PresignedURL(context.Background(), "file.pdf", time.Minute)
			if err != nil {
				t.Fatal(err)
			}
			u, _ := url.Parse(signed)
			if u.Query().Get("X-Amz-Security-Token") != "temporary-test-token" {
				t.Fatal("session token missing")
			}
			if u.Query().Get("X-Amz-Signature") == "" {
				t.Fatal("unsigned URL")
			}
			if err = s.Delete(context.Background(), "file.pdf"); err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestR2RegionDefault(t *testing.T) {
	s, err := NewClient(&config.StorageConfig{Provider: "r2", Endpoint: "https://account.r2.cloudflarestorage.com", AccessKey: "key", SecretKey: "secret", Bucket: "family", AddressingStyle: "path"})
	if err != nil {
		t.Fatal(err)
	}
	signed, err := s.PresignedURL(context.Background(), "file.pdf", time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	u, _ := url.Parse(signed)
	if !strings.Contains(u.Query().Get("X-Amz-Credential"), "/auto/s3/aws4_request") {
		t.Fatal("R2 auto region missing")
	}
}

func TestUnavailableStorageDoesNotAbortAndRecovers(t *testing.T) {
	var mu sync.Mutex
	ready := false
	puts := 0
	var logs bytes.Buffer
	previous := log.Writer()
	log.SetOutput(&logs)
	defer log.SetOutput(previous)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		if !ready {
			w.Header().Set("Content-Type", "application/xml")
			w.WriteHeader(403)
			if r.Method != "HEAD" {
				io.WriteString(w, "<Error><Code>AccessDenied</Code><Message>secret-must-not-be-logged</Message></Error>")
			}
			return
		}
		if r.Method == "PUT" {
			puts++
			w.Header().Set("ETag", "\"ok\"")
		}
	}))
	defer server.Close()
	cfg := &config.StorageConfig{Provider: "minio", Endpoint: server.URL, AccessKey: "private-access-key", SecretKey: "private-secret-key", Bucket: "family", Region: "us-east-1", AddressingStyle: "path", AutoCreateBucket: true}
	client, err := NewClient(cfg)
	if err != nil || client == nil {
		t.Fatal("storage outage aborted initialization", err)
	}
	if _, err = client.Upload(context.Background(), "file.pdf", "application/pdf", strings.NewReader("%PDF-test"), 9); !errors.Is(err, errStorageUnavailable) {
		t.Fatal("unavailable upload must fail safely", err)
	}
	s := client.(*minioStorage)
	mu.Lock()
	ready = true
	mu.Unlock()
	s.bucketMu.Lock()
	s.nextBucketCheck = time.Time{}
	s.bucketMu.Unlock()
	if _, err = client.Upload(context.Background(), "file.pdf", "application/pdf", strings.NewReader("%PDF-test"), 9); err != nil {
		t.Fatal("storage did not recover", err)
	}
	mu.Lock()
	if puts != 1 {
		t.Error("unexpected upload count", puts)
	}
	mu.Unlock()
	for _, secret := range []string{cfg.AccessKey, cfg.SecretKey, "secret-must-not-be-logged"} {
		if strings.Contains(logs.String(), secret) {
			t.Fatal("credential/body leaked in logs")
		}
	}
	if !strings.Contains(logs.String(), "API remains available") {
		t.Fatal("missing degraded-mode diagnostic")
	}
}
func TestInvalidConfigurationDisablesFileFeatures(t *testing.T) {
	s := NewClientOrDisabled(&config.StorageConfig{Provider: "invalid"})
	if s == nil {
		t.Fatal("nil fallback")
	}
	if _, err := s.Upload(context.Background(), "a", "application/pdf", strings.NewReader("a"), 1); !errors.Is(err, errStorageUnavailable) {
		t.Fatal("missing disabled upload error")
	}
	if _, _, _, err := s.GetObject(context.Background(), "a"); !errors.Is(err, errStorageUnavailable) {
		t.Fatal("missing disabled read error")
	}
}
func TestStorageErrorDiagnosticsAreSafe(t *testing.T) {
	if got := storageFailureReason(context.DeadlineExceeded); got != "timeout" {
		t.Fatal(got)
	}
	if got := storageFailureReason(&net.DNSError{Err: "secret", Name: "private"}); got != "dns_lookup_failed" {
		t.Fatal(got)
	}
	if got := storageFailureReason(minio.ErrorResponse{Code: "AccessDenied", StatusCode: 403, Message: "secret"}); got != "s3_code=AccessDenied http_status=403" {
		t.Fatal(got)
	}
	if got := storageFailureReason(minio.ErrorResponse{Code: "AccessDenied secret", StatusCode: 403}); got != "provider_error" {
		t.Fatal(got)
	}
}
