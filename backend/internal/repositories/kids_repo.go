package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type KidsRepository struct{ db *gorm.DB }

func NewKidsRepository(db *gorm.DB) *KidsRepository {
	return &KidsRepository{db: db}
}

// ─── KidProfile ───────────────────────────────────────────────────────────────

func (r *KidsRepository) CreateKid(k *models.KidProfile) error {
	return r.db.Create(k).Error
}

func (r *KidsRepository) GetKidsByFamily(familyID uuid.UUID) ([]models.KidProfile, error) {
	var list []models.KidProfile
	err := r.db.Where("family_id = ?", familyID).Order("birth_date ASC").Find(&list).Error
	return list, err
}

func (r *KidsRepository) GetKidByID(id, familyID uuid.UUID) (*models.KidProfile, error) {
	var k models.KidProfile
	err := r.db.First(&k, "id = ? AND family_id = ?", id, familyID).Error
	return &k, err
}

func (r *KidsRepository) UpdateKid(k *models.KidProfile) error {
	return r.db.Save(k).Error
}

func (r *KidsRepository) DeleteKid(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.KidProfile{}).Error
}

// ─── GrowthRecord ─────────────────────────────────────────────────────────────

func (r *KidsRepository) AddGrowth(g *models.GrowthRecord) error {
	return r.db.Create(g).Error
}

func (r *KidsRepository) GetGrowthByKid(kidID uuid.UUID) ([]models.GrowthRecord, error) {
	var list []models.GrowthRecord
	err := r.db.Where("kid_id = ?", kidID).Order("date ASC").Find(&list).Error
	return list, err
}

func (r *KidsRepository) DeleteGrowth(id, kidID uuid.UUID) error {
	return r.db.Where("id = ? AND kid_id = ?", id, kidID).Delete(&models.GrowthRecord{}).Error
}

// ─── VaccineRecord ────────────────────────────────────────────────────────────

func (r *KidsRepository) AddVaccine(v *models.VaccineRecord) error {
	return r.db.Create(v).Error
}

func (r *KidsRepository) GetVaccinesByKid(kidID uuid.UUID) ([]models.VaccineRecord, error) {
	var list []models.VaccineRecord
	err := r.db.Where("kid_id = ?", kidID).Order("scheduled_date ASC").Find(&list).Error
	return list, err
}

func (r *KidsRepository) GetVaccineByID(id uuid.UUID) (*models.VaccineRecord, error) {
	var v models.VaccineRecord
	err := r.db.First(&v, "id = ?", id).Error
	return &v, err
}

func (r *KidsRepository) UpdateVaccine(v *models.VaccineRecord) error {
	return r.db.Save(v).Error
}

// ─── Milestone ────────────────────────────────────────────────────────────────

func (r *KidsRepository) AddMilestone(m *models.Milestone) error {
	return r.db.Create(m).Error
}

func (r *KidsRepository) GetMilestonesByKid(kidID uuid.UUID) ([]models.Milestone, error) {
	var list []models.Milestone
	err := r.db.Where("kid_id = ?", kidID).Order("category ASC, created_at ASC").Find(&list).Error
	return list, err
}

func (r *KidsRepository) GetMilestoneByID(id uuid.UUID) (*models.Milestone, error) {
	var m models.Milestone
	err := r.db.First(&m, "id = ?", id).Error
	return &m, err
}

func (r *KidsRepository) UpdateMilestone(m *models.Milestone) error {
	return r.db.Save(m).Error
}

func (r *KidsRepository) DeleteMilestone(id, kidID uuid.UUID) error {
	return r.db.Where("id = ? AND kid_id = ?", id, kidID).Delete(&models.Milestone{}).Error
}

// ─── HealthRecord ─────────────────────────────────────────────────────────────

func (r *KidsRepository) AddHealth(h *models.HealthRecord) error {
	return r.db.Create(h).Error
}

func (r *KidsRepository) GetHealthByKid(kidID uuid.UUID) ([]models.HealthRecord, error) {
	var list []models.HealthRecord
	err := r.db.Where("kid_id = ?", kidID).Order("date DESC").Find(&list).Error
	return list, err
}

func (r *KidsRepository) DeleteHealth(id, kidID uuid.UUID) error {
	return r.db.Where("id = ? AND kid_id = ?", id, kidID).Delete(&models.HealthRecord{}).Error
}
