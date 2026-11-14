package services

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"io"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	"keluarga-app/backend/pkg/storage"
	"log"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"
	"unicode/utf8"
)

const MaxDocumentSize int64 = 10 * 1024 * 1024

var ErrDocumentInvalid = errors.New("data dokumen tidak valid")
var ErrDocumentNotFound = errors.New("dokumen tidak ditemukan")
var ErrDocumentStorage = errors.New("penyimpanan dokumen bermasalah; coba lagi")
var ErrDocumentCleanup = errors.New("dokumen dinonaktifkan, tetapi file belum selesai dihapus; tekan Coba hapus lagi")

type DocumentService struct {
	repo    *repositories.DocumentRepository
	storage storage.Storage
	aead    cipher.AEAD
}

func NewDocumentService(repo *repositories.DocumentRepository, store storage.Storage) *DocumentService {
	s, _ := NewDocumentServiceWithKey(repo, store, "")
	return s
}
func NewDocumentServiceWithKey(repo *repositories.DocumentRepository, store storage.Storage, key string) (*DocumentService, error) {
	s := &DocumentService{repo: repo, storage: store}
	if key != "" {
		raw, err := hex.DecodeString(key)
		if err != nil || len(raw) != 32 {
			return nil, errors.New("DOCUMENT_ENCRYPTION_KEY harus 64 karakter hex (32 byte)")
		}
		block, _ := aes.NewCipher(raw)
		s.aead, _ = cipher.NewGCM(block)
	}
	return s, nil
}
func (s *DocumentService) EncryptionAvailable() bool { return s.aead != nil }
func validDocumentType(t string) bool {
	switch t {
	case "ktp", "kk", "akta", "asuransi", "bpjs", "other":
		return true
	}
	return false
}
func documentMetadata(title, kind, tags string) (string, string, string, error) {
	title, kind, tags = strings.TrimSpace(title), strings.TrimSpace(kind), strings.TrimSpace(tags)
	if kind == "" {
		kind = "other"
	}
	if title == "" || utf8.RuneCountInString(title) > 160 || utf8.RuneCountInString(tags) > 300 || !validDocumentType(kind) {
		return "", "", "", fmt.Errorf("%w: nama wajib 1–160 karakter, kategori valid, tag maksimal 300 karakter", ErrDocumentInvalid)
	}
	return title, kind, tags, nil
}
func documentMIME(name string, data []byte) (string, error) {
	ct := http.DetectContentType(data)
	ext := strings.ToLower(filepath.Ext(name))
	allowed := map[string]string{".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
	if allowed[ext] == "" || allowed[ext] != ct {
		return "", fmt.Errorf("%w: gunakan PDF, JPG, PNG, atau WebP dengan isi file yang sesuai", ErrDocumentInvalid)
	}
	return ct, nil
}
func (s *DocumentService) Upload(familyID, userID uuid.UUID, title, kind, tags string, fh *multipart.FileHeader) (*models.Document, string, error) {
	return s.UploadSensitive(familyID, userID, title, kind, tags, fh, false)
}
func (s *DocumentService) UploadSensitive(familyID, userID uuid.UUID, title, kind, tags string, fh *multipart.FileHeader, sensitive bool) (*models.Document, string, error) {
	if fh == nil || fh.Size <= 0 || fh.Size > MaxDocumentSize {
		return nil, "", fmt.Errorf("%w: ukuran file harus 1 byte–10 MB", ErrDocumentInvalid)
	}
	if familyID == uuid.Nil || userID == uuid.Nil {
		return nil, "", ErrDocumentInvalid
	}
	if title == "" {
		title = strings.TrimSuffix(filepath.Base(fh.Filename), filepath.Ext(fh.Filename))
	}
	title, kind, tags, err := documentMetadata(title, kind, tags)
	if err != nil {
		return nil, "", err
	}
	if sensitive && s.aead == nil {
		return nil, "", fmt.Errorf("%w: enkripsi belum dikonfigurasi oleh admin server", ErrDocumentInvalid)
	}
	f, err := fh.Open()
	if err != nil {
		return nil, "", ErrDocumentInvalid
	}
	defer f.Close()
	data, err := io.ReadAll(io.LimitReader(f, MaxDocumentSize+1))
	if err != nil {
		return nil, "", ErrDocumentInvalid
	}
	if len(data) == 0 || int64(len(data)) > MaxDocumentSize {
		return nil, "", ErrDocumentInvalid
	}
	ct, err := documentMIME(fh.Filename, data)
	if err != nil {
		return nil, "", err
	}
	id := uuid.New()
	key := fmt.Sprintf("documents/%s/%s%s", familyID, id, strings.ToLower(filepath.Ext(fh.Filename)))
	originalSize := len(data)
	uploadType := ct
	if sensitive {
		nonce := make([]byte, s.aead.NonceSize())
		if _, err = rand.Read(nonce); err != nil {
			return nil, "", err
		}
		data = s.aead.Seal(nonce, nonce, data, []byte(key))
		uploadType = "application/octet-stream"
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if _, err = s.storage.Upload(ctx, key, uploadType, bytes.NewReader(data), int64(len(data))); err != nil {
		return nil, "", ErrDocumentStorage
	}
	doc := &models.Document{FamilyID: familyID, UploadedBy: userID, Title: title, Type: kind, Tags: tags, ObjectKey: key, FileSize: int64(originalSize), FileName: filepath.Base(fh.Filename), ContentType: ct, IsEncrypted: sensitive}
	doc.ID = id
	if err = s.repo.Create(doc); err != nil {
		cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cleanupCancel()
		if cleanupErr := s.storage.Delete(cleanupCtx, key); cleanupErr != nil {
			log.Printf("document upload cleanup pending: document_id=%s", id)
			return nil, "", ErrDocumentStorage
		}
		return nil, "", err
	}
	return doc, "", nil
}
func (s *DocumentService) GetDocuments(familyID uuid.UUID, kind, search string) ([]map[string]interface{}, error) {
	if kind != "" && !validDocumentType(kind) {
		return nil, ErrDocumentInvalid
	}
	if utf8.RuneCountInString(search) > 300 {
		return nil, ErrDocumentInvalid
	}
	docs, err := s.repo.GetByFamily(familyID, kind, strings.TrimSpace(search))
	if err != nil {
		return nil, err
	}
	result := make([]map[string]interface{}, 0, len(docs))
	for _, d := range docs {
		result = append(result, map[string]interface{}{"id": d.ID, "title": d.Title, "type": d.Type, "tags": d.Tags, "file_size": d.FileSize, "file_name": d.FileName, "content_type": d.ContentType, "is_encrypted": d.IsEncrypted, "storage_delete_pending": d.StorageDeletePending, "created_at": d.CreatedAt, "updated_at": d.UpdatedAt})
	}
	return result, nil
}
func (s *DocumentService) Update(id, familyID uuid.UUID, title, kind, tags string) error {
	title, kind, tags, err := documentMetadata(title, kind, tags)
	if err != nil {
		return err
	}
	if _, err = s.repo.GetByID(id, familyID); err != nil {
		return ErrDocumentNotFound
	}
	err = s.repo.Update(id, familyID, title, kind, tags)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrDocumentNotFound
	}
	return err
}
func (s *DocumentService) Download(id, familyID uuid.UUID) (*models.Document, []byte, error) {
	d, err := s.repo.GetByID(id, familyID)
	if err != nil {
		return nil, nil, ErrDocumentNotFound
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	r, _, _, err := s.storage.GetObject(ctx, d.ObjectKey)
	if err != nil {
		return nil, nil, ErrDocumentStorage
	}
	defer r.Close()
	data, err := io.ReadAll(io.LimitReader(r, MaxDocumentSize+1025))
	if err != nil || int64(len(data)) > MaxDocumentSize+1024 {
		return nil, nil, ErrDocumentStorage
	}
	if d.IsEncrypted {
		if s.aead == nil || len(data) < s.aead.NonceSize() {
			return nil, nil, ErrDocumentStorage
		}
		n := s.aead.NonceSize()
		data, err = s.aead.Open(nil, data[:n], data[n:], []byte(d.ObjectKey))
		if err != nil {
			return nil, nil, ErrDocumentStorage
		}
	}
	// Legacy files are sniffed too: never serve HTML/SVG as active content.
	ct, err := documentMIME(d.ObjectKey, data)
	if err != nil {
		return nil, nil, fmt.Errorf("%w: format file lama tidak didukung", ErrDocumentInvalid)
	}
	d.ContentType = ct
	if d.FileName == "" {
		d.FileName = d.Title + filepath.Ext(d.ObjectKey)
	}
	return d, data, nil
}
func (s *DocumentService) Delete(id, familyID uuid.UUID) error {
	d, err := s.repo.RequestDelete(id, familyID)
	if err != nil {
		return ErrDocumentNotFound
	}
	if d.DeletedAt.Valid && !d.StorageDeletePending {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err = s.storage.Delete(ctx, d.ObjectKey); err != nil {
		return ErrDocumentCleanup
	}
	if err = s.repo.FinishDelete(id, familyID); err != nil {
		return ErrDocumentCleanup
	}
	return nil
}
