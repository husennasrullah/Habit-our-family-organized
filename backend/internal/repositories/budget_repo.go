package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ─── Expense Repository ───────────────────────────────────────────────────────

type ExpenseRepository struct{ db *gorm.DB }

func NewExpenseRepository(db *gorm.DB) *ExpenseRepository {
	return &ExpenseRepository{db: db}
}

func (r *ExpenseRepository) Create(e *models.Expense) error {
	return r.db.Create(e).Error
}

func (r *ExpenseRepository) GetByID(id, familyID uuid.UUID) (*models.Expense, error) {
	var e models.Expense
	err := r.db.First(&e, "id = ? AND family_id = ?", id, familyID).Error
	return &e, err
}

type ExpenseQueryOpts struct {
	Month    int    // 0 = ignore
	Year     int    // 0 = ignore
	Category string
}

func (r *ExpenseRepository) GetByFamily(familyID uuid.UUID, opts ExpenseQueryOpts) ([]models.Expense, error) {
	var list []models.Expense
	q := r.db.Where("family_id = ?", familyID)
	if opts.Month > 0 && opts.Year > 0 {
		q = q.Where("EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?", opts.Month, opts.Year)
	} else if opts.Year > 0 {
		q = q.Where("EXTRACT(YEAR FROM date) = ?", opts.Year)
	}
	if opts.Category != "" {
		q = q.Where("category = ?", opts.Category)
	}
	err := q.Order("date DESC, created_at DESC").Find(&list).Error
	return list, err
}

func (r *ExpenseRepository) Update(e *models.Expense) error {
	return r.db.Save(e).Error
}

func (r *ExpenseRepository) Delete(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.Expense{}).Error
}

// SummaryByCategory — total per kategori dalam rentang bulan/tahun
type CategorySummary struct {
	Category string  `json:"category"`
	Total    float64 `json:"total"`
	Count    int     `json:"count"`
}

func (r *ExpenseRepository) SummaryByCategory(familyID uuid.UUID, month, year int) ([]CategorySummary, error) {
	var rows []CategorySummary
	q := r.db.Raw(`
		SELECT category, SUM(amount) AS total, COUNT(*) AS count
		FROM expenses
		WHERE family_id = ?
		  AND EXTRACT(MONTH FROM date) = ?
		  AND EXTRACT(YEAR FROM date) = ?
		  AND deleted_at IS NULL
		GROUP BY category
		ORDER BY total DESC
	`, familyID, month, year).Scan(&rows)
	return rows, q.Error
}

// SummaryByMonth — total per bulan dalam satu tahun
type MonthSummary struct {
	Month int     `json:"month"`
	Total float64 `json:"total"`
}

func (r *ExpenseRepository) SummaryByMonth(familyID uuid.UUID, year int) ([]MonthSummary, error) {
	var rows []MonthSummary
	q := r.db.Raw(`
		SELECT EXTRACT(MONTH FROM date)::int AS month, SUM(amount) AS total
		FROM expenses
		WHERE family_id = ?
		  AND EXTRACT(YEAR FROM date) = ?
		  AND deleted_at IS NULL
		GROUP BY 1
		ORDER BY 1
	`, familyID, year).Scan(&rows)
	return rows, q.Error
}

// ─── Budget Repository ────────────────────────────────────────────────────────

type BudgetRepository struct{ db *gorm.DB }

func NewBudgetRepository(db *gorm.DB) *BudgetRepository {
	return &BudgetRepository{db: db}
}

func (r *BudgetRepository) Upsert(b *models.Budget) error {
	// cari existing berdasarkan family+category+month+year
	var existing models.Budget
	err := r.db.Where(
		"family_id = ? AND category = ? AND month = ? AND year = ? AND deleted_at IS NULL",
		b.FamilyID, b.Category, b.Month, b.Year,
	).First(&existing).Error

	if err == nil {
		// update
		existing.Amount = b.Amount
		existing.Period = b.Period
		return r.db.Save(&existing).Error
	}
	return r.db.Create(b).Error
}

func (r *BudgetRepository) GetByFamily(familyID uuid.UUID, month, year int) ([]models.Budget, error) {
	var list []models.Budget
	err := r.db.Where("family_id = ? AND month = ? AND year = ?", familyID, month, year).
		Find(&list).Error
	return list, err
}

func (r *BudgetRepository) Delete(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.Budget{}).Error
}

// ─── Shopping Repository ──────────────────────────────────────────────────────

type ShoppingRepository struct{ db *gorm.DB }

func NewShoppingRepository(db *gorm.DB) *ShoppingRepository {
	return &ShoppingRepository{db: db}
}

func (r *ShoppingRepository) Create(s *models.ShoppingItem) error {
	return r.db.Create(s).Error
}

func (r *ShoppingRepository) GetByFamily(familyID uuid.UUID) ([]models.ShoppingItem, error) {
	var list []models.ShoppingItem
	err := r.db.Where("family_id = ?", familyID).
		Order("is_checked ASC, created_at DESC").
		Find(&list).Error
	return list, err
}

func (r *ShoppingRepository) GetByID(id, familyID uuid.UUID) (*models.ShoppingItem, error) {
	var s models.ShoppingItem
	err := r.db.First(&s, "id = ? AND family_id = ?", id, familyID).Error
	return &s, err
}

func (r *ShoppingRepository) Update(s *models.ShoppingItem) error {
	return r.db.Save(s).Error
}

func (r *ShoppingRepository) Delete(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.ShoppingItem{}).Error
}

func (r *ShoppingRepository) DeleteChecked(familyID uuid.UUID) error {
	return r.db.Where("family_id = ? AND is_checked = true", familyID).Delete(&models.ShoppingItem{}).Error
}
