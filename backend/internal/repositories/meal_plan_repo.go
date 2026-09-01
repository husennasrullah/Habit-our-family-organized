package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MealPlanRepository struct {
	db *gorm.DB
}

func NewMealPlanRepository(db *gorm.DB) *MealPlanRepository {
	return &MealPlanRepository{db: db}
}

func (r *MealPlanRepository) Create(m *models.MealPlan) error {
	return r.db.Create(m).Error
}

func (r *MealPlanRepository) GetByID(id, familyID uuid.UUID) (*models.MealPlan, error) {
	var m models.MealPlan
	if err := r.db.Where("id = ? AND family_id = ?", id, familyID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// GetByDateRange mengambil semua meal plan dalam rentang tanggal (inklusif) untuk satu keluarga.
// from & to format: "YYYY-MM-DD"
func (r *MealPlanRepository) GetByDateRange(familyID uuid.UUID, from, to string) ([]models.MealPlan, error) {
	var plans []models.MealPlan
	if err := r.db.
		Where("family_id = ? AND date >= ? AND date <= ?", familyID, from, to).
		Order("date ASC, meal_type ASC").
		Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}

// GetByDate mengambil semua meal plan pada tanggal tertentu — dipakai scheduler notifikasi.
func (r *MealPlanRepository) GetByDate(familyID uuid.UUID, date string) ([]models.MealPlan, error) {
	var plans []models.MealPlan
	if err := r.db.
		Where("family_id = ? AND date = ?", familyID, date).
		Order("meal_type ASC").
		Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *MealPlanRepository) Update(m *models.MealPlan) error {
	return r.db.Save(m).Error
}

func (r *MealPlanRepository) Delete(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.MealPlan{}).Error
}
