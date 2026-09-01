package repositories

import (
	"errors"

	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FamilyMemberRepository struct {
	db *gorm.DB
}

func NewFamilyMemberRepository(db *gorm.DB) *FamilyMemberRepository {
	return &FamilyMemberRepository{db: db}
}

func (r *FamilyMemberRepository) Create(m *models.FamilyMember) error {
	return r.db.Create(m).Error
}

func (r *FamilyMemberRepository) GetByID(id uuid.UUID) (*models.FamilyMember, error) {
	var m models.FamilyMember
	err := r.db.Preload("Family").First(&m, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *FamilyMemberRepository) GetByEmail(email string) (*models.FamilyMember, error) {
	var m models.FamilyMember
	err := r.db.First(&m, "email = ?", email).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &m, err
}

func (r *FamilyMemberRepository) GetByGoogleID(googleID string) (*models.FamilyMember, error) {
	var m models.FamilyMember
	err := r.db.First(&m, "google_id = ?", googleID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &m, err
}

func (r *FamilyMemberRepository) Update(m *models.FamilyMember) error {
	return r.db.Save(m).Error
}

func (r *FamilyMemberRepository) GetByFamilyID(familyID uuid.UUID) ([]models.FamilyMember, error) {
	var members []models.FamilyMember
	err := r.db.Where("family_id = ?", familyID).Find(&members).Error
	return members, err
}

func (r *FamilyMemberRepository) DeleteByID(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.FamilyMember{}).Error
}
