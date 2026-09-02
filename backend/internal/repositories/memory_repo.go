package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
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
	q := r.db.Preload("Photos", func(db *gorm.DB) *gorm.DB {
		// Subquery: ambil 1 foto cover per memory menggunakan DISTINCT ON (PostgreSQL)
		return db.Where(`id IN (
			SELECT DISTINCT ON (memory_id) id
			FROM memory_photos
			WHERE deleted_at IS NULL
			ORDER BY memory_id, "order" ASC, created_at ASC
		)`)
	}).Where("family_id = ?", familyID)

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
	return r.db.Save(m).Error
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
