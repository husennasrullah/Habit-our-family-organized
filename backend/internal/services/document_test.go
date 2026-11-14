package services

import (
	"bytes"
	"context"
	"errors"
	"github.com/google/uuid"
	"io"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	"mime/multipart"
	"net/http/httptest"
	"os"
	"strings"
	"sync"
	"testing"
	"time"
)

type documentTestStorage struct {
	mu         sync.Mutex
	files      map[string][]byte
	failDelete bool
}

func (s *documentTestStorage) Upload(_ context.Context, key, _ string, r io.Reader, _ int64) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, _ := io.ReadAll(r)
	s.files[key] = b
	return key, nil
}
func (s *documentTestStorage) Delete(_ context.Context, key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.failDelete {
		return errors.New("offline")
	}
	delete(s.files, key)
	return nil
}
func (s *documentTestStorage) PublicURL(string) string { return "https://must-not-be-used.example" }
func (s *documentTestStorage) PresignedURL(context.Context, string, time.Duration) (string, error) {
	return "", errors.New("must not sign documents")
}
func (s *documentTestStorage) GetObject(_ context.Context, key string) (io.ReadCloser, string, int64, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, ok := s.files[key]
	if !ok {
		return nil, "", 0, errors.New("missing")
	}
	return io.NopCloser(bytes.NewReader(b)), "application/pdf", int64(len(b)), nil
}
func documentFile(t *testing.T, name, content string) *multipart.FileHeader {
	t.Helper()
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	part, _ := w.CreateFormFile("file", name)
	part.Write([]byte(content))
	w.Close()
	r := httptest.NewRequest("POST", "/", &body)
	r.Header.Set("Content-Type", w.FormDataContentType())
	if err := r.ParseMultipartForm(1024 * 1024); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { r.MultipartForm.RemoveAll() })
	return r.MultipartForm.File["file"][0]
}
func TestDocumentValidation(t *testing.T) {
	if _, _, _, err := documentMetadata(" ", "ktp", ""); err == nil {
		t.Fatal("blank title")
	}
	if _, _, _, err := documentMetadata("A", "invalid", ""); err == nil {
		t.Fatal("invalid category")
	}
	for _, f := range []struct{ name, data string }{{"bad.html", "<html>bad</html>"}, {"fake.pdf", "<script>bad</script>"}, {"wrong.jpg", "%PDF-1.7"}} {
		if _, err := documentMIME(f.name, []byte(f.data)); err == nil {
			t.Fatal("unsupported/spoofed file accepted")
		}
	}
	if _, err := NewDocumentServiceWithKey(nil, nil, "bad"); err == nil {
		t.Fatal("invalid encryption key")
	}
	for _, size := range []int64{-1, 0, MaxDocumentSize + 1} {
		svc := NewDocumentService(nil, nil)
		if _, _, err := svc.Upload(uuid.New(), uuid.New(), "A", "other", "", &multipart.FileHeader{Size: size}); err == nil {
			t.Fatal("invalid size accepted")
		}
	}
	s := NewDocumentService(nil, nil)
	if _, _, err := s.UploadSensitive(uuid.New(), uuid.New(), "A", "other", "", documentFile(t, "file.pdf", "%PDF-1.7 test"), true); err == nil {
		t.Fatal("encryption without key")
	}
}
func TestDocumentLifecycle(t *testing.T) {
	db := financeDB(t)
	if err := db.AutoMigrate(&models.Document{}); err != nil {
		t.Fatal(err)
	}
	sqlMigration, err := os.ReadFile("../../migrations/013_document_metadata.sql")
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 2; i++ {
		if err = db.Exec(string(sqlMigration)).Error; err != nil {
			t.Fatal(err)
		}
	}
	repo := repositories.NewDocumentRepository(db)
	store := &documentTestStorage{files: map[string][]byte{}}
	key := strings.Repeat("ab", 32)
	svc, err := NewDocumentServiceWithKey(repo, store, key)
	if err != nil {
		t.Fatal(err)
	}
	family, other, actor := uuid.New(), uuid.New(), uuid.New()
	plain := "%PDF-1.7 family document"
	doc, _, err := svc.UploadSensitive(family, actor, " Kartu Keluarga ", "kk", " ayah ", documentFile(t, "KK.pdf", plain), true)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(store.files[doc.ObjectKey], []byte(plain)) {
		t.Fatal("plaintext stored")
	}
	read, got, err := svc.Download(doc.ID, family)
	if err != nil || string(got) != plain || !read.IsEncrypted {
		t.Fatal("decrypt failed", err)
	}
	if _, _, err = svc.Download(doc.ID, other); !errors.Is(err, ErrDocumentNotFound) {
		t.Fatal("family isolation failed")
	}
	if err = svc.Update(doc.ID, other, "Other", "other", ""); err == nil {
		t.Fatal("foreign edit accepted")
	}
	if err = svc.Delete(doc.ID, other); err == nil {
		t.Fatal("foreign delete accepted")
	}
	if err = svc.Update(doc.ID, family, "New name", "ktp", ""); err != nil {
		t.Fatal(err)
	}
	list, err := svc.GetDocuments(family, "ktp", "New")
	if err != nil || len(list) != 1 {
		t.Fatal("search failed", err)
	}
	if _, ok := list[0]["url"]; ok {
		t.Fatal("public file URL exposed")
	}
	if _, ok := list[0]["object_key"]; ok {
		t.Fatal("storage key exposed")
	}
	wrong, _ := NewDocumentServiceWithKey(repo, store, strings.Repeat("cd", 32))
	if _, _, err = wrong.Download(doc.ID, family); err == nil {
		t.Fatal("wrong key decrypted")
	}
	store.files[doc.ObjectKey][len(store.files[doc.ObjectKey])-1] ^= 1
	if _, _, err = svc.Download(doc.ID, family); err == nil {
		t.Fatal("tampered file accepted")
	}
	store.failDelete = true
	if err = svc.Delete(doc.ID, family); !errors.Is(err, ErrDocumentCleanup) {
		t.Fatal("cleanup failure hidden", err)
	}
	if _, _, err = svc.Download(doc.ID, family); err == nil {
		t.Fatal("tombstoned file accessible")
	}
	list, _ = svc.GetDocuments(family, "", "")
	if len(list) != 1 || list[0]["storage_delete_pending"] != true {
		t.Fatal("pending cleanup invisible")
	}
	store.failDelete = false
	if err = svc.Delete(doc.ID, family); err != nil {
		t.Fatal("retry failed", err)
	}
	list, _ = svc.GetDocuments(family, "", "")
	if err = svc.Delete(doc.ID, family); err != nil {
		t.Fatal("idempotent delete failed", err)
	}
	if len(list) != 0 || len(store.files) != 0 {
		t.Fatal("cleanup incomplete")
	}
	// Plain uploads and old metadata remain readable through the same private API.
	doc, _, err = svc.Upload(family, actor, "plain", "other", "", documentFile(t, "plain.pdf", plain))
	if err != nil {
		t.Fatal(err)
	}
	if _, got, err = svc.Download(doc.ID, family); err != nil || string(got) != plain {
		t.Fatal("plain read failed", err)
	}
	db.Model(doc).Updates(map[string]interface{}{"file_name": "", "content_type": ""})
	if _, _, err = svc.Download(doc.ID, family); err != nil {
		t.Fatal("legacy read failed", err)
	}
}
