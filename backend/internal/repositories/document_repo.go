package repositories

import (
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"keluarga-app/backend/internal/models"
	"strings"
	"time"
)

type DocumentRepository struct{ db *gorm.DB }

func NewDocumentRepository(db *gorm.DB) *DocumentRepository   { return &DocumentRepository{db: db} }
func (r *DocumentRepository) Create(d *models.Document) error { return r.db.Create(d).Error }
func (r *DocumentRepository) GetByFamily(familyID uuid.UUID, docType, search string) ([]models.Document, error) {
	var list []models.Document
	q := r.db.Unscoped().Where("family_id = ? AND (deleted_at IS NULL OR storage_delete_pending = true)", familyID)
	if docType != "" {
		q = q.Where("type = ?", docType)
	}
	if search != "" {
		like := "%" + strings.NewReplacer("\\", "\\\\", "%", "\\%", "_", "\\_").Replace(strings.ToLower(search)) + "%"
		q = q.Where("(LOWER(title) LIKE ? OR LOWER(tags) LIKE ?)", like, like)
	}
	err := q.Order("created_at DESC").Find(&list).Error
	return list, err
}
func (r *DocumentRepository) GetByID(id, familyID uuid.UUID) (*models.Document, error) {
	var d models.Document
	err := r.db.First(&d, "id = ? AND family_id = ?", id, familyID).Error
	return &d, err
}
func (r *DocumentRepository) Update(id, familyID uuid.UUID, title, kind, tags string) error {
	result := r.db.Model(&models.Document{}).Where("id = ? AND family_id = ?", id, familyID).Updates(map[string]interface{}{"title": title, "type": kind, "tags": tags})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// Persist a tombstone before touching storage. Failed cleanup remains visible and retryable.
func (r *DocumentRepository) RequestDelete(id, familyID uuid.UUID) (*models.Document, error) {
	var d models.Document
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Unscoped().Clauses(clause.Locking{Strength: "UPDATE"}).First(&d, "id = ? AND family_id = ?", id, familyID).Error; err != nil {
			return err
		}
		if d.DeletedAt.Valid && !d.StorageDeletePending {
			return nil
		}
		return tx.Unscoped().Model(&models.Document{}).Where("id = ? AND family_id = ?", id, familyID).Updates(map[string]interface{}{"deleted_at": time.Now(), "storage_delete_pending": true}).Error
	})
	return &d, err
}
func (r *DocumentRepository) FinishDelete(id, familyID uuid.UUID) error {
	res := r.db.Unscoped().Model(&models.Document{}).Where("id = ? AND family_id = ? AND storage_delete_pending = true", id, familyID).Update("storage_delete_pending", false)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		var count int64
		if err := r.db.Unscoped().Model(&models.Document{}).Where("id = ? AND family_id = ? AND deleted_at IS NOT NULL AND storage_delete_pending = false", id, familyID).Count(&count).Error; err == nil && count == 1 {
			return nil
		}
		return errors.New("penghapusan tidak dapat diselesaikan")
	}
	return nil
}
