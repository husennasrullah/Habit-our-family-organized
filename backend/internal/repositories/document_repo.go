package repositories

import (
	"keluarga-app/backend/internal/models"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DocumentRepository struct{ db *gorm.DB }

func NewDocumentRepository(db *gorm.DB) *DocumentRepository {
	return &DocumentRepository{db: db}
}

func (r *DocumentRepository) Create(d *models.Document) error {
	return r.db.Create(d).Error
}

func (r *DocumentRepository) GetByFamily(familyID uuid.UUID, docType, search string) ([]models.Document, error) {
	var list []models.Document
	q := r.db.Where("family_id = ?", familyID)
	if docType != "" {
		q = q.Where("type = ?", docType)
	}
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		q = q.Where("LOWER(title) LIKE ? OR LOWER(tags) LIKE ?", like, like)
	}
	err := q.Order("created_at DESC").Find(&list).Error
	return list, err
}

func (r *DocumentRepository) GetByID(id, familyID uuid.UUID) (*models.Document, error) {
	var d models.Document
	err := r.db.First(&d, "id = ? AND family_id = ?", id, familyID).Error
	return &d, err
}

func (r *DocumentRepository) Delete(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.Document{}).Error
}
