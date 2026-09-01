package services

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	"keluarga-app/backend/pkg/storage"

	"github.com/google/uuid"
)

type DocumentService struct {
	repo    *repositories.DocumentRepository
	storage storage.Storage
}

func NewDocumentService(repo *repositories.DocumentRepository, storage storage.Storage) *DocumentService {
	return &DocumentService{repo: repo, storage: storage}
}

const docPresignExpiry = 15 * time.Minute

func (s *DocumentService) Upload(
	familyID, userID uuid.UUID,
	title, docType, tags string,
	fh *multipart.FileHeader,
) (*models.Document, string, error) {
	if title == "" {
		title = fh.Filename
	}
	if docType == "" {
		docType = "other"
	}

	f, err := fh.Open()
	if err != nil {
		return nil, "", fmt.Errorf("gagal membuka file: %w", err)
	}
	defer f.Close()

	ext := strings.ToLower(filepath.Ext(fh.Filename))
	key := fmt.Sprintf("documents/%s/%s%s", familyID, uuid.New(), ext)
	ct  := fh.Header.Get("Content-Type")
	if ct == "" { ct = "application/octet-stream" }

	if _, err := s.storage.Upload(context.Background(), key, ct, f, fh.Size); err != nil {
		return nil, "", fmt.Errorf("gagal upload: %w", err)
	}

	doc := &models.Document{
		FamilyID:   familyID,
		UploadedBy: userID,
		Title:      title,
		Type:       docType,
		ObjectKey:  key,
		FileSize:   fh.Size,
		Tags:       tags,
	}
	if err := s.repo.Create(doc); err != nil {
		_ = s.storage.Delete(context.Background(), key)
		return nil, "", err
	}

	url := s.storage.PublicURL(key)
	if url == "" || strings.HasPrefix(url, "/") {
		url, _ = s.storage.PresignedURL(context.Background(), key, docPresignExpiry)
	}
	return doc, url, nil
}

func (s *DocumentService) GetDocuments(familyID uuid.UUID, docType, search string) ([]map[string]interface{}, error) {
	docs, err := s.repo.GetByFamily(familyID, docType, search)
	if err != nil {
		return nil, err
	}
	result := make([]map[string]interface{}, 0, len(docs))
	for _, d := range docs {
		url := s.storage.PublicURL(d.ObjectKey)
		if url == "" || strings.HasPrefix(url, "/") {
			url, _ = s.storage.PresignedURL(context.Background(), d.ObjectKey, docPresignExpiry)
		}
		m := map[string]interface{}{
			"id":           d.ID,
			"family_id":    d.FamilyID,
			"uploaded_by":  d.UploadedBy,
			"title":        d.Title,
			"type":         d.Type,
			"object_key":   d.ObjectKey,
			"file_size":    d.FileSize,
			"is_encrypted": d.IsEncrypted,
			"tags":         d.Tags,
			"url":          url,
			"created_at":   d.CreatedAt,
			"updated_at":   d.UpdatedAt,
		}
		result = append(result, m)
	}
	return result, nil
}

func (s *DocumentService) Delete(id, familyID uuid.UUID) error {
	doc, err := s.repo.GetByID(id, familyID)
	if err != nil {
		return errors.New("dokumen tidak ditemukan")
	}
	_ = s.storage.Delete(context.Background(), doc.ObjectKey)
	return s.repo.Delete(id, familyID)
}
