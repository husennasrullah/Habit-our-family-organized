package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FinancialGoalRepository struct{ db *gorm.DB }

func NewFinancialGoalRepository(db *gorm.DB) *FinancialGoalRepository {
	return &FinancialGoalRepository{db: db}
}

func (r *FinancialGoalRepository) Create(g *models.FinancialGoal) error {
	return r.db.Create(g).Error
}

func (r *FinancialGoalRepository) GetByFamily(familyID uuid.UUID) ([]models.FinancialGoal, error) {
	var list []models.FinancialGoal
	err := r.db.Where("family_id = ?", familyID).
		Order("created_at DESC").
		Find(&list).Error
	return list, err
}

func (r *FinancialGoalRepository) GetByID(id, familyID uuid.UUID) (*models.FinancialGoal, error) {
	var g models.FinancialGoal
	err := r.db.First(&g, "id = ? AND family_id = ?", id, familyID).Error
	return &g, err
}

func (r *FinancialGoalRepository) Update(g *models.FinancialGoal) error {
	return r.db.Save(g).Error
}

func (r *FinancialGoalRepository) Delete(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.FinancialGoal{}).Error
}
