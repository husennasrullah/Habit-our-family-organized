package repositories

import (
	"errors"

	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FamilyRepository struct {
	db *gorm.DB
}

func NewFamilyRepository(db *gorm.DB) *FamilyRepository {
	return &FamilyRepository{db: db}
}

func (r *FamilyRepository) Create(f *models.Family) error {
	return r.db.Create(f).Error
}

func (r *FamilyRepository) GetByID(id uuid.UUID) (*models.Family, error) {
	var f models.Family
	err := r.db.Preload("Members").First(&f, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *FamilyRepository) GetByInviteCode(code string) (*models.Family, error) {
	var f models.Family
	err := r.db.First(&f, "invite_code = ?", code).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &f, err
}

func (r *FamilyRepository) Update(f *models.Family) error {
	return r.db.Save(f).Error
}
