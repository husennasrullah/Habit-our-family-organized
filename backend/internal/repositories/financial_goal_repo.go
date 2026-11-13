package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FinancialGoalRepository struct{ db *gorm.DB }

func NewFinancialGoalRepository(db *gorm.DB) *FinancialGoalRepository {
	return &FinancialGoalRepository{db: db}
}

func (r *FinancialGoalRepository) Create(g *models.FinancialGoal) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(g).Error; err != nil {
			return err
		}
		if g.CurrentAmount > 0 {
			return tx.Create(&models.FinancialGoalEntry{FamilyID: g.FamilyID, GoalID: g.ID, ActorID: &g.CreatedBy, Amount: g.CurrentAmount, BalanceAfter: g.CurrentAmount, Kind: "opening", Note: "Saldo awal"}).Error
		}
		return nil
	})
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

// Mutate serializes balance edits and deposits on the same goal and writes its ledger atomically.
func (r *FinancialGoalRepository) Mutate(id, familyID, actorID uuid.UUID, kind, note string, change func(*models.FinancialGoal) error) (*models.FinancialGoal, error) {
	var goal models.FinancialGoal
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&goal, "id = ? AND family_id = ?", id, familyID).Error; err != nil {
			return err
		}
		before := goal.CurrentAmount
		if err := change(&goal); err != nil {
			return err
		}
		goal.IsAchieved = goal.CurrentAmount >= goal.TargetAmount
		if before != goal.CurrentAmount {
			var count int64
			if err := tx.Model(&models.FinancialGoalEntry{}).Where("goal_id = ? AND family_id = ?", id, familyID).Count(&count).Error; err != nil {
				return err
			}
			if count == 0 && before > 0 {
				if err := tx.Create(&models.FinancialGoalEntry{FamilyID: familyID, GoalID: id, Amount: before, BalanceAfter: before, Kind: "opening", Note: "Saldo sebelum pencatatan riwayat"}).Error; err != nil {
					return err
				}
			}
			if err := tx.Create(&models.FinancialGoalEntry{FamilyID: familyID, GoalID: id, ActorID: &actorID, Amount: goal.CurrentAmount - before, BalanceAfter: goal.CurrentAmount, Kind: kind, Note: note}).Error; err != nil {
				return err
			}
		}
		return tx.Save(&goal).Error
	})
	return &goal, err
}
func (r *FinancialGoalRepository) Entries(id, familyID uuid.UUID) ([]models.FinancialGoalEntry, error) {
	if _, err := r.GetByID(id, familyID); err != nil {
		return nil, err
	}
	var rows []models.FinancialGoalEntry
	err := r.db.Model(&models.FinancialGoalEntry{}).
		Select("financial_goal_entries.*, COALESCE(family_members.name, '') AS actor_name").
		Joins("LEFT JOIN family_members ON family_members.id = financial_goal_entries.actor_id AND family_members.family_id = financial_goal_entries.family_id").
		Where("financial_goal_entries.goal_id = ? AND financial_goal_entries.family_id = ?", id, familyID).
		Order("financial_goal_entries.created_at DESC, financial_goal_entries.id DESC").Find(&rows).Error
	return rows, err
}
