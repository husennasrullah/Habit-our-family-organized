package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type MemoryRepository struct{ db *gorm.DB }

func NewMemoryRepository(db *gorm.DB) *MemoryRepository {
	return &MemoryRepository{db: db}
}

type MemoryQueryOpts struct {
	Year       int
	Month      int
	IsFavorite *bool
}

func (r *MemoryRepository) Create(m *models.Memory) error {
	return r.db.Create(m).Error
}

func (r *MemoryRepository) GetByID(id, familyID uuid.UUID) (*models.Memory, error) {
	var m models.Memory
	err := r.db.Preload("Photos", func(db *gorm.DB) *gorm.DB {
		return db.Order(`"order" ASC, created_at ASC`)
	}).First(&m, "id = ? AND family_id = ?", id, familyID).Error
	return &m, err
}

func (r *MemoryRepository) GetByFamily(familyID uuid.UUID, opts MemoryQueryOpts) ([]models.Memory, error) {
	var list []models.Memory
	q := r.db.Preload("Photos", func(db *gorm.DB) *gorm.DB { return db.Order(`"order" ASC, created_at ASC`) }).Where("family_id = ?", familyID)

	if opts.Year > 0 {
		q = q.Where("EXTRACT(YEAR FROM date) = ?", opts.Year)
	}
	if opts.Month > 0 {
		q = q.Where("EXTRACT(MONTH FROM date) = ?", opts.Month)
	}
	if opts.IsFavorite != nil {
		q = q.Where("is_favorite = ?", *opts.IsFavorite)
	}

	err := q.Order("date DESC, created_at DESC").Find(&list).Error
	return list, err
}

func (r *MemoryRepository) Update(m *models.Memory) error {
	return r.db.Model(&models.Memory{}).Where("id = ? AND family_id = ? AND storage_delete_pending = false", m.ID, m.FamilyID).Updates(map[string]interface{}{"title": m.Title, "content": m.Content, "date": m.Date, "is_favorite": m.IsFavorite}).Error
}

func (r *MemoryRepository) Delete(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.Memory{}).Error
}

// ─── Photos ───────────────────────────────────────────────────────────────────

func (r *MemoryRepository) AddPhoto(p *models.MemoryPhoto) error {
	return r.db.Create(p).Error
}

func (r *MemoryRepository) GetPhotoByID(id uuid.UUID) (*models.MemoryPhoto, error) {
	var p models.MemoryPhoto
	err := r.db.First(&p, "id = ?", id).Error
	return &p, err
}

func (r *MemoryRepository) DeletePhoto(id uuid.UUID) error {
	return r.db.Delete(&models.MemoryPhoto{}, "id = ?", id).Error
}

func (r *MemoryRepository) GetPhotosByMemory(memoryID uuid.UUID) ([]models.MemoryPhoto, error) {
	var photos []models.MemoryPhoto
	err := r.db.Where("memory_id = ?", memoryID).
		Order(`"order" ASC, created_at ASC`).
		Find(&photos).Error
	return photos, err
}

// Every mutation locks the parent, including photo upload and deletion.
func (r *MemoryRepository) Locked(id, familyID uuid.UUID, fn func(*MemoryRepository, *models.Memory) error) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var m models.Memory
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&m, "id = ? AND family_id = ?", id, familyID).Error; err != nil {
			return err
		}
		return fn(&MemoryRepository{db: tx}, &m)
	})
}
func (r *MemoryRepository) MarkMemoryPending(id uuid.UUID) error {
	return r.db.Model(&models.Memory{}).Where("id = ?", id).Update("storage_delete_pending", true).Error
}
func (r *MemoryRepository) MarkPhotoPending(id uuid.UUID) error {
	return r.db.Model(&models.MemoryPhoto{}).Where("id = ?", id).Update("storage_delete_pending", true).Error
}

func (r *MemoryRepository) ActivatePhoto(id uuid.UUID) error {
	return r.db.Model(&models.MemoryPhoto{}).Where("id = ?", id).Updates(map[string]interface{}{"upload_pending": false, "storage_delete_pending": false}).Error
}

func (r *MemoryRepository) MemoryDeleted(id, familyID uuid.UUID) bool {
	var count int64
	return r.db.Unscoped().Model(&models.Memory{}).Where("id = ? AND family_id = ? AND deleted_at IS NOT NULL", id, familyID).Count(&count).Error == nil && count == 1
}
func (r *MemoryRepository) PhotoForDelete(id, familyID uuid.UUID) (*models.MemoryPhoto, error) {
	var p models.MemoryPhoto
	err := r.db.Unscoped().Table("memory_photos").Select("memory_photos.*").Joins("JOIN memories ON memories.id = memory_photos.memory_id").Where("memory_photos.id = ? AND memories.family_id = ?", id, familyID).First(&p).Error
	return &p, err
}
