package services

import (
	"errors"
	"time"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"

	"github.com/google/uuid"
)

// ─── DTOs ────────────────────────────────────────────────────────────────────

type CreateExpenseRequest struct {
	Amount      float64 `json:"amount"      validate:"required,gt=0"`
	Currency    string  `json:"currency"`
	Category    string  `json:"category"    validate:"required"`
	Description string  `json:"description"`
	Date        string  `json:"date"        validate:"required"`
}

type UpdateExpenseRequest struct {
	Amount      *float64 `json:"amount"`
	Currency    *string  `json:"currency"`
	Category    *string  `json:"category"`
	Description *string  `json:"description"`
	Date        *string  `json:"date"`
}

type UpsertBudgetRequest struct {
	Category string  `json:"category" validate:"required"`
	Amount   float64 `json:"amount"   validate:"required,gt=0"`
	Period   string  `json:"period"`
	Month    int     `json:"month"    validate:"required"`
	Year     int     `json:"year"     validate:"required"`
}

type CreateShoppingItemRequest struct {
	Name     string `json:"name"     validate:"required"`
	Quantity string `json:"quantity"`
	Unit     string `json:"unit"`
	Category string `json:"category"`
}

// ─── Service ─────────────────────────────────────────────────────────────────

type BudgetService struct {
	expenseRepo  *repositories.ExpenseRepository
	budgetRepo   *repositories.BudgetRepository
	shoppingRepo *repositories.ShoppingRepository
}

func NewBudgetService(
	expenseRepo *repositories.ExpenseRepository,
	budgetRepo *repositories.BudgetRepository,
	shoppingRepo *repositories.ShoppingRepository,
) *BudgetService {
	return &BudgetService{expenseRepo, budgetRepo, shoppingRepo}
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

func (s *BudgetService) CreateExpense(req CreateExpenseRequest, familyID, userID uuid.UUID) (*models.Expense, error) {
	if req.Amount <= 0 {
		return nil, errors.New("nominal harus lebih dari 0")
	}
	if req.Category == "" {
		return nil, errors.New("kategori wajib diisi")
	}
	if req.Date == "" {
		req.Date = time.Now().Format("2006-01-02")
	}

	currency := req.Currency
	if currency == "" {
		currency = "IDR"
	}

	e := &models.Expense{
		FamilyID:    familyID,
		CreatedBy:   userID,
		Amount:      req.Amount,
		Currency:    currency,
		Category:    req.Category,
		Description: req.Description,
		Date:        req.Date,
	}
	if err := s.expenseRepo.Create(e); err != nil {
		return nil, err
	}
	return e, nil
}

func (s *BudgetService) GetExpenses(familyID uuid.UUID, month, year int, category string) ([]models.Expense, error) {
	return s.expenseRepo.GetByFamily(familyID, repositories.ExpenseQueryOpts{
		Month: month, Year: year, Category: category,
	})
}

func (s *BudgetService) UpdateExpense(id uuid.UUID, req UpdateExpenseRequest, familyID uuid.UUID) (*models.Expense, error) {
	e, err := s.expenseRepo.GetByID(id, familyID)
	if err != nil {
		return nil, errors.New("pengeluaran tidak ditemukan")
	}
	if req.Amount != nil {
		e.Amount = *req.Amount
	}
	if req.Currency != nil {
		e.Currency = *req.Currency
	}
	if req.Category != nil {
		e.Category = *req.Category
	}
	if req.Description != nil {
		e.Description = *req.Description
	}
	if req.Date != nil {
		e.Date = *req.Date
	}
	if err := s.expenseRepo.Update(e); err != nil {
		return nil, err
	}
	return e, nil
}

func (s *BudgetService) DeleteExpense(id, familyID uuid.UUID) error {
	_, err := s.expenseRepo.GetByID(id, familyID)
	if err != nil {
		return errors.New("pengeluaran tidak ditemukan")
	}
	return s.expenseRepo.Delete(id, familyID)
}

func (s *BudgetService) GetSummary(familyID uuid.UUID, month, year int) (map[string]interface{}, error) {
	byCategory, err := s.expenseRepo.SummaryByCategory(familyID, month, year)
	if err != nil {
		return nil, err
	}
	byMonth, err := s.expenseRepo.SummaryByMonth(familyID, year)
	if err != nil {
		return nil, err
	}

	total := 0.0
	for _, c := range byCategory {
		total += c.Total
	}

	return map[string]interface{}{
		"by_category": byCategory,
		"by_month":    byMonth,
		"total":       total,
	}, nil
}

// ─── Budgets ─────────────────────────────────────────────────────────────────

func (s *BudgetService) UpsertBudget(req UpsertBudgetRequest, familyID uuid.UUID) (*models.Budget, error) {
	if req.Category == "" {
		return nil, errors.New("kategori wajib diisi")
	}
	period := req.Period
	if period == "" {
		period = "monthly"
	}

	b := &models.Budget{
		FamilyID: familyID,
		Category: req.Category,
		Amount:   req.Amount,
		Period:   period,
		Month:    req.Month,
		Year:     req.Year,
	}
	if err := s.budgetRepo.Upsert(b); err != nil {
		return nil, err
	}
	return b, nil
}

func (s *BudgetService) GetBudgets(familyID uuid.UUID, month, year int) ([]models.Budget, error) {
	return s.budgetRepo.GetByFamily(familyID, month, year)
}

func (s *BudgetService) DeleteBudget(id, familyID uuid.UUID) error {
	return s.budgetRepo.Delete(id, familyID)
}

// ─── Shopping Items ───────────────────────────────────────────────────────────

func (s *BudgetService) CreateShoppingItem(req CreateShoppingItemRequest, familyID, userID uuid.UUID) (*models.ShoppingItem, error) {
	if req.Name == "" {
		return nil, errors.New("nama item wajib diisi")
	}
	qty := req.Quantity
	if qty == "" {
		qty = "1"
	}

	item := &models.ShoppingItem{
		FamilyID: familyID,
		AddedBy:  userID,
		Name:     req.Name,
		Quantity: qty,
		Unit:     req.Unit,
		Category: req.Category,
	}
	if err := s.shoppingRepo.Create(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *BudgetService) GetShoppingItems(familyID uuid.UUID) ([]models.ShoppingItem, error) {
	return s.shoppingRepo.GetByFamily(familyID)
}

func (s *BudgetService) ToggleShoppingItem(id, familyID, userID uuid.UUID) (*models.ShoppingItem, error) {
	item, err := s.shoppingRepo.GetByID(id, familyID)
	if err != nil {
		return nil, errors.New("item tidak ditemukan")
	}
	item.IsChecked = !item.IsChecked
	if item.IsChecked {
		item.CheckedBy = &userID
	} else {
		item.CheckedBy = nil
	}
	if err := s.shoppingRepo.Update(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *BudgetService) DeleteShoppingItem(id, familyID uuid.UUID) error {
	_, err := s.shoppingRepo.GetByID(id, familyID)
	if err != nil {
		return errors.New("item tidak ditemukan")
	}
	return s.shoppingRepo.Delete(id, familyID)
}

func (s *BudgetService) ClearCheckedItems(familyID uuid.UUID) error {
	return s.shoppingRepo.DeleteChecked(familyID)
}
