package services

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"
	"unicode/utf8"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	"keluarga-app/backend/pkg/storage"

	"github.com/google/uuid"
)

// ─── DTOs ────────────────────────────────────────────────────────────────────

type CreateMemoryRequest struct {
	Title   string `json:"title"   validate:"required"`
	Content string `json:"content"`
	Date    string `json:"date"    validate:"required"`
}

type UpdateMemoryRequest struct {
	Title      *string `json:"title"`
	Content    *string `json:"content"`
	Date       *string `json:"date"`
	IsFavorite *bool   `json:"is_favorite"`
}

type MemoryListRequest struct {
	Year       int
	Month      int
	IsFavorite *bool
}

// MemoryResponse extends Memory dengan presigned URLs untuk foto
type MemoryResponse struct {
	models.Memory
	Photos []PhotoResponse `json:"photos"`
}

type PhotoResponse struct {
	models.MemoryPhoto
	URL string `json:"url"` // presigned atau public URL
}

// ─── Service ─────────────────────────────────────────────────────────────────

type MemoryService struct {
	repo    *repositories.MemoryRepository
	storage storage.Storage // interface — tidak tahu provider konkretnya
}

func NewMemoryService(repo *repositories.MemoryRepository, storage storage.Storage) *MemoryService {
	return &MemoryService{repo: repo, storage: storage}
}

// resolvePhotos mengisi URL proxy untuk setiap foto.
// URL mengarah ke endpoint /memories/:id/photos/:photo_id/serve di backend,
// sehingga MinIO tidak perlu diekspos ke publik.
func (s *MemoryService) resolvePhotos(photos []models.MemoryPhoto) []PhotoResponse {
	result := make([]PhotoResponse, 0, len(photos))
	for _, p := range photos {
		url := ""
		if !p.StorageDeletePending && !p.UploadPending {
			// Gunakan URL proxy — dihandle oleh ServePhoto handler
			url = fmt.Sprintf("/api/v1/memories/%s/photos/%s/serve", p.MemoryID, p.ID)
		}
		result = append(result, PhotoResponse{MemoryPhoto: p, URL: url})
	}
	return result
}

func (s *MemoryService) Create(req CreateMemoryRequest, familyID, userID uuid.UUID) (*models.Memory, error) {
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" || utf8.RuneCountInString(req.Title) > 160 || utf8.RuneCountInString(req.Content) > 20000 {
		return nil, errors.New("judul kenangan wajib diisi")
	}
	if req.Date == "" {
		req.Date = time.Now().UTC().Add(7 * time.Hour).Format("2006-01-02")
	}
	if !validMemoryDate(req.Date) {
		return nil, errors.New("tanggal tidak valid")
	}
	m := &models.Memory{
		FamilyID:  familyID,
		CreatedBy: userID,
		Title:     req.Title,
		Content:   req.Content,
		Date:      req.Date,
	}
	if err := s.repo.Create(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *MemoryService) GetList(familyID uuid.UUID, req MemoryListRequest) ([]MemoryResponse, error) {
	if req.Year < 0 || req.Year > 9999 || req.Month < 0 || req.Month > 12 {
		return nil, errors.New("filter tanggal tidak valid")
	}
	list, err := s.repo.GetByFamily(familyID, repositories.MemoryQueryOpts{
		Year: req.Year, Month: req.Month, IsFavorite: req.IsFavorite,
	})
	if err != nil {
		return nil, err
	}

	result := make([]MemoryResponse, 0, len(list))
	for _, m := range list {
		result = append(result, MemoryResponse{
			Memory: m,
			Photos: s.resolvePhotos(m.Photos),
		})
	}
	return result, nil
}

func (s *MemoryService) GetByID(id, familyID uuid.UUID) (*MemoryResponse, error) {
	m, err := s.repo.GetByID(id, familyID)
	if err != nil {
		return nil, errors.New("kenangan tidak ditemukan")
	}
	return &MemoryResponse{Memory: *m, Photos: s.resolvePhotos(m.Photos)}, nil
}

func (s *MemoryService) Update(id uuid.UUID, req UpdateMemoryRequest, familyID uuid.UUID) (*models.Memory, error) {
	var result *models.Memory
	err := s.repo.Locked(id, familyID, func(r *repositories.MemoryRepository, m *models.Memory) error {
		if m.StorageDeletePending {
			return errors.New("kenangan sedang dihapus")
		}
		if req.Title != nil {
			m.Title = strings.TrimSpace(*req.Title)
		}
		if req.Content != nil {
			m.Content = *req.Content
		}
		if req.Date != nil {
			m.Date = *req.Date
		} else if len(m.Date) > 10 {
			m.Date = m.Date[:10]
		}
		if req.IsFavorite != nil {
			m.IsFavorite = *req.IsFavorite
		}
		if m.Title == "" || utf8.RuneCountInString(m.Title) > 160 || utf8.RuneCountInString(m.Content) > 20000 {
			return errors.New("judul wajib 1–160 karakter dan cerita maksimal 20.000 karakter")
		}
		if !validMemoryDate(m.Date) {
			return errors.New("tanggal tidak valid")
		}
		result = m
		return r.Update(m)
	})
	return result, err
}

const MaxMemoryPhotoSize int64 = 8 * 1024 * 1024
const MaxMemoryPhotos = 20

var ErrMemoryCleanup = errors.New("file belum selesai dihapus; tekan Coba hapus lagi")

func memoryImage(name string, data []byte) (string, error) {
	ct := http.DetectContentType(data)
	allowed := map[string]string{".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
	if allowed[strings.ToLower(filepath.Ext(name))] != ct || len(data) == 0 {
		return "", errors.New("gunakan foto JPG, PNG, atau WebP dengan isi file yang sesuai")
	}
	return ct, nil
}

// Persist deletion intent before storage work. Pending items remain visible for retry.
func (s *MemoryService) Delete(id, familyID uuid.UUID) error {
	if s.repo.MemoryDeleted(id, familyID) {
		return nil
	}
	if err := s.repo.Locked(id, familyID, func(r *repositories.MemoryRepository, m *models.Memory) error { return r.MarkMemoryPending(id) }); err != nil {
		if s.repo.MemoryDeleted(id, familyID) {
			return nil
		}
		return err
	}
	m, err := s.repo.GetByID(id, familyID)
	if err != nil {
		if s.repo.MemoryDeleted(id, familyID) {
			return nil
		}
		return err
	}
	for _, p := range m.Photos {
		if err = s.DeletePhoto(p.ID, familyID); err != nil {
			return ErrMemoryCleanup
		}
	}
	return s.repo.Delete(id, familyID)
}

func (s *MemoryService) UploadPhotos(memoryID, familyID uuid.UUID, files []*multipart.FileHeader) ([]PhotoResponse, error) {
	if len(files) == 0 || len(files) > MaxMemoryPhotos {
		return nil, errors.New("pilih 1–20 foto")
	}
	type upload struct {
		data    []byte
		ct, ext string
	}
	uploads := make([]upload, 0, len(files))
	var total int64
	for _, fh := range files {
		total += fh.Size
		if total > 40*1024*1024 {
			return nil, errors.New("total unggahan maksimal 40 MB; tambahkan foto secara bertahap")
		}
		if fh.Size <= 0 || fh.Size > MaxMemoryPhotoSize {
			return nil, errors.New("ukuran setiap foto maksimal 8 MB")
		}
		f, err := fh.Open()
		if err != nil {
			return nil, errors.New("foto tidak dapat dibaca")
		}
		data, err := io.ReadAll(io.LimitReader(f, MaxMemoryPhotoSize+1))
		f.Close()
		if err != nil || int64(len(data)) > MaxMemoryPhotoSize {
			return nil, errors.New("foto tidak dapat dibaca atau terlalu besar")
		}
		ct, err := memoryImage(fh.Filename, data)
		if err != nil {
			return nil, err
		}
		uploads = append(uploads, upload{data, ct, strings.ToLower(filepath.Ext(fh.Filename))})
	}
	// Stage cleanup records before uploading so even a failed cleanup remains retryable.
	var staged []models.MemoryPhoto
	err := s.repo.Locked(memoryID, familyID, func(r *repositories.MemoryRepository, m *models.Memory) error {
		if m.StorageDeletePending {
			return errors.New("kenangan sedang dihapus")
		}
		existing, err := r.GetPhotosByMemory(memoryID)
		if err != nil {
			return err
		}
		if len(existing)+len(files) > MaxMemoryPhotos {
			return errors.New("maksimal 20 foto per kenangan, termasuk foto menunggu penghapusan")
		}
		order := 0
		for _, p := range existing {
			if p.Order >= order {
				order = p.Order + 1
			}
		}
		for i, u := range uploads {
			p := models.MemoryPhoto{MemoryID: memoryID, ObjectKey: fmt.Sprintf("memories/%s/%s/%s%s", familyID, memoryID, uuid.New(), u.ext), Order: order + i, UploadPending: true}
			if err = r.AddPhoto(&p); err != nil {
				return err
			}
			staged = append(staged, p)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	err = s.repo.Locked(memoryID, familyID, func(r *repositories.MemoryRepository, m *models.Memory) error {
		if m.StorageDeletePending {
			return errors.New("kenangan sedang dihapus")
		}
		for _, p := range staged {
			if current, err := r.GetPhotoByID(p.ID); err != nil || current.StorageDeletePending || !current.UploadPending {
				return errors.New("foto berubah; muat ulang kenangan sebelum mengunggah")
			}
		}
		for i, p := range staged {
			u := uploads[i]
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			_, err := s.storage.Upload(ctx, p.ObjectKey, u.ct, bytes.NewReader(u.data), int64(len(u.data)))
			cancel()
			if err != nil {
				return errors.New("upload foto gagal; foto yang belum selesai akan dibersihkan")
			}
		}
		for i := range staged {
			staged[i].UploadPending = false
			staged[i].StorageDeletePending = false
			if err := r.ActivatePhoto(staged[i].ID); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		for _, p := range staged {
			if e := s.DeletePhoto(p.ID, familyID); e != nil {
				log.Printf("memory photo cleanup pending: photo_id=%s", p.ID)
			}
		}
		return nil, err
	}
	return s.resolvePhotos(staged), nil
}

func (s *MemoryService) GetPhotoStream(photoID, familyID uuid.UUID) (io.ReadCloser, string, int64, error) {
	p, err := s.repo.GetPhotoByID(photoID)
	if err != nil || p.StorageDeletePending || p.UploadPending {
		return nil, "", 0, errors.New("foto tidak tersedia")
	}
	m, err := s.repo.GetByID(p.MemoryID, familyID)
	if err != nil || m.StorageDeletePending {
		return nil, "", 0, errors.New("foto tidak tersedia")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	r, _, _, err := s.storage.GetObject(ctx, p.ObjectKey)
	if err != nil {
		return nil, "", 0, errors.New("foto belum dapat dimuat")
	}
	defer r.Close()
	data, err := io.ReadAll(io.LimitReader(r, MaxMemoryPhotoSize+1))
	if err != nil || int64(len(data)) > MaxMemoryPhotoSize {
		return nil, "", 0, errors.New("foto terlalu besar atau gagal dibaca")
	}
	ct, err := memoryImage(p.ObjectKey, data)
	if err != nil {
		return nil, "", 0, err
	}
	return io.NopCloser(bytes.NewReader(data)), ct, int64(len(data)), nil
}
func (s *MemoryService) DeletePhoto(photoID, familyID uuid.UUID) error {
	p, err := s.repo.PhotoForDelete(photoID, familyID)
	if err != nil {
		return err
	}
	if p.DeletedAt.Valid {
		return nil
	}
	if err = s.repo.Locked(p.MemoryID, familyID, func(r *repositories.MemoryRepository, m *models.Memory) error { return r.MarkPhotoPending(photoID) }); err != nil {
		if current, e := s.repo.PhotoForDelete(photoID, familyID); e == nil && current.DeletedAt.Valid {
			return nil
		}
		return err
	}
	return s.repo.Locked(p.MemoryID, familyID, func(r *repositories.MemoryRepository, m *models.Memory) error {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := s.storage.Delete(ctx, p.ObjectKey); err != nil {
			return ErrMemoryCleanup
		}
		return r.DeletePhoto(photoID)
	})
}

func (s *MemoryService) PhotoBelongsTo(photoID, memoryID, familyID uuid.UUID) bool {
	p, e := s.repo.GetPhotoByID(photoID)
	if e != nil || p.MemoryID != memoryID {
		return false
	}
	_, e = s.repo.GetByID(memoryID, familyID)
	return e == nil
}

func validMemoryDate(raw string) bool {
	d, err := time.Parse("2006-01-02", raw)
	return err == nil && d.Year() > 0 && d.Format("2006-01-02") == raw
}

func (s *MemoryService) PhotoBelongsForDelete(photoID, memoryID, familyID uuid.UUID) bool {
	p, e := s.repo.PhotoForDelete(photoID, familyID)
	return e == nil && p.MemoryID == memoryID
}
