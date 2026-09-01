package services

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

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
		url := s.storage.PublicURL(p.ObjectKey)
		if url == "" {
			// Gunakan URL proxy — dihandle oleh ServePhoto handler
			url = fmt.Sprintf("/api/v1/memories/%s/photos/%s/serve", p.MemoryID, p.ID)
		}
		result = append(result, PhotoResponse{MemoryPhoto: p, URL: url})
	}
	return result
}

func (s *MemoryService) Create(req CreateMemoryRequest, familyID, userID uuid.UUID) (*models.Memory, error) {
	if req.Title == "" {
		return nil, errors.New("judul kenangan wajib diisi")
	}
	if req.Date == "" {
		req.Date = time.Now().Format("2006-01-02")
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
	m, err := s.repo.GetByID(id, familyID)
	if err != nil {
		return nil, errors.New("kenangan tidak ditemukan")
	}
	if req.Title != nil {
		m.Title = *req.Title
	}
	if req.Content != nil {
		m.Content = *req.Content
	}
	if req.Date != nil {
		m.Date = *req.Date
	}
	if req.IsFavorite != nil {
		m.IsFavorite = *req.IsFavorite
	}
	if err := s.repo.Update(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *MemoryService) Delete(id, familyID uuid.UUID) error {
	m, err := s.repo.GetByID(id, familyID)
	if err != nil {
		return errors.New("kenangan tidak ditemukan")
	}
	// Hapus semua foto dari storage terlebih dahulu
	for _, p := range m.Photos {
		_ = s.storage.Delete(nil, p.ObjectKey) //nolint
	}
	return s.repo.Delete(id, familyID)
}

// UploadPhotos menerima multiple file, upload ke storage, simpan record ke DB.
func (s *MemoryService) UploadPhotos(memoryID, familyID uuid.UUID, files []*multipart.FileHeader) ([]PhotoResponse, error) {
	// Validasi memory milik family ini
	m, err := s.repo.GetByID(memoryID, familyID)
	if err != nil {
		return nil, errors.New("kenangan tidak ditemukan")
	}

	// Hitung order mulai dari jumlah foto yang sudah ada
	existing, _ := s.repo.GetPhotosByMemory(m.ID)
	baseOrder := len(existing)

	var results []PhotoResponse
	for i, fh := range files {
		f, err := fh.Open()
		if err != nil {
			return nil, fmt.Errorf("gagal membuka file: %w", err)
		}
		defer f.Close()

		ext := strings.ToLower(filepath.Ext(fh.Filename))
		key := fmt.Sprintf("memories/%s/%s%s", memoryID, uuid.New(), ext)

		contentType := fh.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "image/jpeg"
		}

		if _, err := s.storage.Upload(context.Background(), key, contentType, f, fh.Size); err != nil { //nolint
			return nil, fmt.Errorf("gagal upload foto: %w", err)
		}

		photo := &models.MemoryPhoto{
			MemoryID:  memoryID,
			ObjectKey: key,
			Order:     baseOrder + i,
		}
		if err := s.repo.AddPhoto(photo); err != nil {
			// Rollback: hapus dari storage
			_ = s.storage.Delete(nil, key) //nolint
			return nil, err
		}

		url := s.storage.PublicURL(key)
		if url == "" {
			url = fmt.Sprintf("/api/v1/memories/%s/photos/%s/serve", memoryID, photo.ID)
		}
		results = append(results, PhotoResponse{MemoryPhoto: *photo, URL: url})
	}
	return results, nil
}

// GetPhotoStream mengambil stream foto langsung dari storage — dipakai oleh proxy handler.
func (s *MemoryService) GetPhotoStream(photoID, familyID uuid.UUID) (io.ReadCloser, string, error) {
	photo, err := s.repo.GetPhotoByID(photoID)
	if err != nil {
		return nil, "", errors.New("foto tidak ditemukan")
	}
	if _, err := s.repo.GetByID(photo.MemoryID, familyID); err != nil {
		return nil, "", errors.New("akses ditolak")
	}
	return s.storage.GetObject(context.Background(), photo.ObjectKey)
}

func (s *MemoryService) DeletePhoto(photoID, familyID uuid.UUID) error {
	photo, err := s.repo.GetPhotoByID(photoID)
	if err != nil {
		return errors.New("foto tidak ditemukan")
	}
	// Validasi foto ini milik family yang tepat
	if _, err := s.repo.GetByID(photo.MemoryID, familyID); err != nil {
		return errors.New("akses ditolak")
	}
	_ = s.storage.Delete(nil, photo.ObjectKey) //nolint
	return s.repo.DeletePhoto(photoID)
}
