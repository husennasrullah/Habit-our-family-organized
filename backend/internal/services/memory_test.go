package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"image"
	"image/png"
	"io"
	"mime/multipart"
	"os"
	"strings"
	"sync"
	"testing"

	"github.com/google/uuid"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
)

func memoryPNG(t *testing.T) []byte {
	t.Helper()
	var b bytes.Buffer
	if err := png.Encode(&b, image.NewRGBA(image.Rect(0, 0, 2, 2))); err != nil {
		t.Fatal(err)
	}
	return b.Bytes()
}
func TestMemoryValidation(t *testing.T) {
	svc := NewMemoryService(nil, nil)
	if validMemoryDate("0000-01-01") || validMemoryDate("2026-11-01T00:00:00Z") {
		t.Fatal("invalid date accepted")
	}
	encoded, _ := json.Marshal(svc.resolvePhotos([]models.MemoryPhoto{{ObjectKey: "secret/path.png"}}))
	if bytes.Contains(encoded, []byte("secret/path")) {
		t.Fatal("object key exposed")
	}
	for _, r := range []CreateMemoryRequest{{Title: " "}, {Title: strings.Repeat("a", 161)}, {Title: "OK", Date: "2026-02-30"}, {Title: "OK", Content: strings.Repeat("a", 20001)}} {
		if _, e := svc.Create(r, uuid.New(), uuid.New()); e == nil {
			t.Fatal("invalid metadata accepted")
		}
	}
	for _, f := range []struct {
		name string
		data []byte
	}{{"x.svg", []byte("<svg/>")}, {"x.png", []byte("<html>bad</html>")}, {"x.jpg", memoryPNG(t)}, {"empty.png", nil}} {
		if _, e := memoryImage(f.name, f.data); e == nil {
			t.Fatal("invalid image accepted", f.name)
		}
	}
	if _, e := memoryImage("ok.PNG", memoryPNG(t)); e != nil {
		t.Fatal(e)
	}
	if _, e := svc.UploadPhotos(uuid.New(), uuid.New(), nil); e == nil {
		t.Fatal("empty upload accepted")
	}
}

type memoryTestStorage struct {
	documentTestStorage
	failAt int
	calls  int
}

func (s *memoryTestStorage) Upload(ctx context.Context, key, ct string, r io.Reader, size int64) (string, error) {
	s.calls++
	if s.failAt > 0 && s.calls == s.failAt {
		return "", errors.New("offline")
	}
	return s.documentTestStorage.Upload(ctx, key, ct, r, size)
}
func TestMemoryLifecycleAndConcurrency(t *testing.T) {
	db := financeDB(t)
	if e := db.AutoMigrate(&models.Memory{}, &models.MemoryPhoto{}); e != nil {
		t.Fatal(e)
	}
	migration, e := os.ReadFile("../../migrations/015_memory_cleanup.sql")
	if e != nil {
		t.Fatal(e)
	}
	for i := 0; i < 2; i++ {
		if e = db.Exec(string(migration)).Error; e != nil {
			t.Fatal(e)
		}
	}
	store := &memoryTestStorage{documentTestStorage: documentTestStorage{files: map[string][]byte{}}}
	svc := NewMemoryService(repositories.NewMemoryRepository(db), store)
	family, user := uuid.New(), uuid.New()
	m, e := svc.Create(CreateMemoryRequest{Title: "  Piknik  ", Content: "Cerita", Date: "2026-11-16"}, family, user)
	if e != nil {
		t.Fatal(e)
	}
	if m.Title != "Piknik" {
		t.Fatal("title not trimmed")
	}
	photos, e := svc.UploadPhotos(m.ID, family, []*multipart.FileHeader{documentFile(t, "a.png", string(memoryPNG(t))), documentFile(t, "b.png", string(memoryPNG(t)))})
	if e != nil {
		t.Fatal(e)
	}
	if len(photos) != 2 || !strings.HasPrefix(photos[0].URL, "/api/v1/") {
		t.Fatal("private photos missing")
	}
	if _, e = svc.GetByID(m.ID, uuid.New()); e == nil {
		t.Fatal("foreign family read")
	}
	if svc.PhotoBelongsTo(photos[0].ID, uuid.New(), family) {
		t.Fatal("wrong parent accepted")
	}
	if _, _, _, e = svc.GetPhotoStream(photos[0].ID, uuid.New()); e == nil {
		t.Fatal("foreign photo read")
	}
	r, ct, _, e := svc.GetPhotoStream(photos[0].ID, family)
	if e != nil || ct != "image/png" {
		t.Fatal("read", e, ct)
	}
	r.Close()
	var wg sync.WaitGroup
	errs := make(chan error, 2)
	title := "Baru"
	favorite := true
	wg.Add(2)
	go func() {
		defer wg.Done()
		_, e := svc.Update(m.ID, UpdateMemoryRequest{Title: &title}, family)
		errs <- e
	}()
	go func() {
		defer wg.Done()
		_, e := svc.Update(m.ID, UpdateMemoryRequest{IsFavorite: &favorite}, family)
		errs <- e
	}()
	wg.Wait()
	close(errs)
	for e := range errs {
		if e != nil {
			t.Fatal(e)
		}
	}
	current, e := svc.GetByID(m.ID, family)
	if e != nil || current.Title != "Baru" || !current.IsFavorite {
		t.Fatal("concurrent metadata lost", e)
	}
	store.failDelete = true
	if e = svc.DeletePhoto(photos[0].ID, family); !errors.Is(e, ErrMemoryCleanup) {
		t.Fatal("cleanup not reported", e)
	}
	if _, _, _, e = svc.GetPhotoStream(photos[0].ID, family); e == nil {
		t.Fatal("pending photo accessible")
	}
	store.failDelete = false
	if e = svc.DeletePhoto(photos[0].ID, family); e != nil {
		t.Fatal(e)
	}
	store.failAt = store.calls + 2
	if _, e = svc.UploadPhotos(m.ID, family, []*multipart.FileHeader{documentFile(t, "c.png", string(memoryPNG(t))), documentFile(t, "d.png", string(memoryPNG(t)))}); e == nil {
		t.Fatal("failed batch accepted")
	}
	current, e = svc.GetByID(m.ID, family)
	if e != nil || len(current.Photos) != 1 {
		t.Fatal("partial batch retained", e, len(current.Photos))
	}
	store.failAt = store.calls + 2
	store.failDelete = true
	if _, e = svc.UploadPhotos(m.ID, family, []*multipart.FileHeader{documentFile(t, "e.png", string(memoryPNG(t))), documentFile(t, "f.png", string(memoryPNG(t)))}); e == nil {
		t.Fatal("failed cleanup batch accepted")
	}
	current, e = svc.GetByID(m.ID, family)
	if e != nil || len(current.Photos) != 3 {
		t.Fatal("retry records missing", e)
	}
	for _, p := range current.Photos {
		if p.StorageDeletePending && p.URL != "" {
			t.Fatal("pending upload has URL")
		}
	}
	store.failDelete = false
	for _, p := range current.Photos {
		if p.StorageDeletePending {
			if e = svc.DeletePhoto(p.ID, family); e != nil {
				t.Fatal(e)
			}
		}
	}
	store.failAt = 0
	var uploadWG sync.WaitGroup
	uploadErrs := make(chan error, 6)
	for i := 0; i < 6; i++ {
		file := documentFile(t, "concurrent.png", string(memoryPNG(t)))
		uploadWG.Add(1)
		go func() {
			defer uploadWG.Done()
			_, err := svc.UploadPhotos(m.ID, family, []*multipart.FileHeader{file})
			uploadErrs <- err
		}()
	}
	uploadWG.Wait()
	close(uploadErrs)
	for e := range uploadErrs {
		if e != nil {
			t.Fatal(e)
		}
	}
	current, e = svc.GetByID(m.ID, family)
	if e != nil || len(current.Photos) != 7 {
		t.Fatal("concurrent upload lost", e)
	}
	orders := map[int]bool{}
	for _, p := range current.Photos {
		if orders[p.Order] {
			t.Fatal("duplicate photo order")
		}
		orders[p.Order] = true
	}
	store.failDelete = true
	if e = svc.Delete(m.ID, family); !errors.Is(e, ErrMemoryCleanup) {
		t.Fatal("memory cleanup not reported", e)
	}
	if _, _, _, e = svc.GetPhotoStream(photos[1].ID, family); e == nil {
		t.Fatal("pending memory accessible")
	}
	if _, e = svc.Update(m.ID, UpdateMemoryRequest{Title: &title}, family); e == nil {
		t.Fatal("pending memory editable")
	}
	store.failDelete = false
	if e = svc.Delete(m.ID, family); e != nil {
		t.Fatal(e)
	}
	if e = svc.Delete(m.ID, family); e != nil {
		t.Fatal("delete retry not idempotent", e)
	}
	if e = svc.DeletePhoto(photos[0].ID, family); e != nil {
		t.Fatal("photo retry not idempotent", e)
	}
	if e = svc.DeletePhoto(photos[0].ID, uuid.New()); e == nil {
		t.Fatal("foreign photo delete accepted")
	}
	if len(store.files) != 0 {
		t.Fatal("storage leaked")
	}
	if _, e = svc.Update(m.ID, UpdateMemoryRequest{Title: &title}, family); e == nil {
		t.Fatal("deleted memory resurrected")
	}
}
