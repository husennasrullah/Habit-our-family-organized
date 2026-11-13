package repositories

import (
	"keluarga-app/backend/internal/models"

	"errors"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"strings"
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
	Month    int // 0 = ignore
	Year     int // 0 = ignore
	Category string
}

func (r *ExpenseRepository) GetByFamily(familyID uuid.UUID, opts ExpenseQueryOpts) ([]models.Expense, error) {
	var list []models.Expense
	q := r.db.Where("family_id = ? AND currency = ?", familyID, "IDR")
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
 AND currency = 'IDR'
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
 AND currency = 'IDR'
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
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Serialize the same family/category/month without requiring destructive deduplication of old rows.
		key := b.FamilyID.String() + ":" + b.Category + ":" + fmt.Sprint(b.Month) + ":" + fmt.Sprint(b.Year)
		if err := tx.Exec("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", key).Error; err != nil {
			return err
		}
		var existing models.Budget
		err := tx.Where("family_id = ? AND category = ? AND month = ? AND year = ?", b.FamilyID, b.Category, b.Month, b.Year).First(&existing).Error
		if err == nil {
			existing.Amount = b.Amount
			existing.Period = b.Period
			if err := tx.Save(&existing).Error; err != nil {
				return err
			}
			*b = existing
			return nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		return tx.Create(b).Error
	})
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
	err := r.db.Where("family_id = ? AND expense_id IS NULL", familyID).
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
	return r.db.Where("family_id = ? AND is_checked = true AND expense_id IS NULL", familyID).Delete(&models.ShoppingItem{}).Error
}

// Checkout locks selected items in a stable order, so concurrent submissions cannot double-charge.
func (r *ShoppingRepository) Checkout(ids []uuid.UUID, e *models.Expense) (*models.Expense, error) {
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var items []models.ShoppingItem
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("family_id = ? AND id IN ?", e.FamilyID, ids).Order("id").Find(&items).Error; err != nil {
			return err
		}
		if len(items) != len(ids) {
			return errors.New("item tidak ditemukan")
		}
		names := make([]string, 0, len(items))
		for _, item := range items {
			if !item.IsChecked || item.ExpenseID != nil {
				return errors.New("item belum dicentang atau sudah dicatat; muat ulang daftar belanja")
			}
			names = append(names, item.Name)
		}
		if e.Description == "" {
			e.Description = "Belanja: " + strings.Join(names, ", ")
		} else {
			e.Description += " — " + strings.Join(names, ", ")
		}
		if err := tx.Create(e).Error; err != nil {
			return err
		}
		return tx.Model(&models.ShoppingItem{}).Where("family_id = ? AND id IN ?", e.FamilyID, ids).Update("expense_id", e.ID).Error
	})
	return e, err
}

func (r *ShoppingRepository) Toggle(id, familyID, userID uuid.UUID) (*models.ShoppingItem, error) {
	var item models.ShoppingItem
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&item, "id = ? AND family_id = ?", id, familyID).Error; err != nil {
			return err
		}
		if item.ExpenseID != nil {
			return errors.New("belanja sudah dicatat sebagai pengeluaran")
		}
		item.IsChecked = !item.IsChecked
		if item.IsChecked {
			item.CheckedBy = &userID
		} else {
			item.CheckedBy = nil
		}
		return tx.Save(&item).Error
	})
	return &item, err
}
