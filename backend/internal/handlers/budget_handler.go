package handlers

import (
	"strconv"
	"time"

	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type BudgetHandler struct {
	budgetService *services.BudgetService
}

func NewBudgetHandler(budgetService *services.BudgetService) *BudgetHandler {
	return &BudgetHandler{budgetService: budgetService}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func parseMonthYear(c *fiber.Ctx) (int, int) {
	now := time.Now()
	month, err := strconv.Atoi(c.Query("month"))
	if err != nil || month < 1 || month > 12 {
		month = int(now.Month())
	}
	year, err := strconv.Atoi(c.Query("year"))
	if err != nil || year < 2000 {
		year = now.Year()
	}
	return month, year
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

// GetExpenses godoc
// @Summary Daftar pengeluaran
// @Tags budget
// @Security BearerAuth
// @Param month    query int    false "Bulan (1-12)"
// @Param year     query int    false "Tahun"
// @Param category query string false "Kategori"
// @Success 200 {object} map[string]interface{}
// @Router /expenses [get]
func (h *BudgetHandler) GetExpenses(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}

	month, year := parseMonthYear(c)
	category := c.Query("category")

	list, err := h.budgetService.GetExpenses(familyID, month, year, category)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil data"})
	}
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}

// CreateExpense godoc
// @Summary Tambah pengeluaran
// @Tags budget
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body services.CreateExpenseRequest true "Expense payload"
// @Success 201 {object} map[string]interface{}
// @Router /expenses [post]
func (h *BudgetHandler) CreateExpense(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	userID := getUserID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}

	var req services.CreateExpenseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	expense, err := h.budgetService.CreateExpense(req, familyID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": expense, "message": "pengeluaran ditambahkan"})
}

// UpdateExpense godoc
// @Summary Update pengeluaran
// @Tags budget
// @Security BearerAuth
// @Param id path string true "Expense ID"
// @Success 200 {object} map[string]interface{}
// @Router /expenses/{id} [put]
func (h *BudgetHandler) UpdateExpense(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	familyID := getFamilyID(c)

	var req services.UpdateExpenseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	expense, err := h.budgetService.UpdateExpense(id, req, familyID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": expense, "message": "pengeluaran diperbarui"})
}

// DeleteExpense godoc
// @Summary Hapus pengeluaran
// @Tags budget
// @Security BearerAuth
// @Param id path string true "Expense ID"
// @Success 200 {object} map[string]string
// @Router /expenses/{id} [delete]
func (h *BudgetHandler) DeleteExpense(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	if err := h.budgetService.DeleteExpense(id, getFamilyID(c)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "pengeluaran dihapus"})
}

// GetSummary godoc
// @Summary Ringkasan pengeluaran bulan ini
// @Tags budget
// @Security BearerAuth
// @Param month query int false "Bulan"
// @Param year  query int false "Tahun"
// @Success 200 {object} map[string]interface{}
// @Router /expenses/summary [get]
func (h *BudgetHandler) GetSummary(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}
	month, year := parseMonthYear(c)
	summary, err := h.budgetService.GetSummary(familyID, month, year)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil summary"})
	}
	return c.JSON(fiber.Map{"data": summary, "message": "success"})
}

// ─── Budgets ─────────────────────────────────────────────────────────────────

// GetBudgets godoc
// @Summary Daftar target budget
// @Tags budget
// @Security BearerAuth
// @Param month query int false "Bulan"
// @Param year  query int false "Tahun"
// @Success 200 {object} map[string]interface{}
// @Router /budgets [get]
func (h *BudgetHandler) GetBudgets(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}
	month, year := parseMonthYear(c)
	list, err := h.budgetService.GetBudgets(familyID, month, year)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil data"})
	}
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}

// UpsertBudget godoc
// @Summary Buat atau update target budget
// @Tags budget
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body services.UpsertBudgetRequest true "Budget payload"
// @Success 200 {object} map[string]interface{}
// @Router /budgets [post]
func (h *BudgetHandler) UpsertBudget(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}
	var req services.UpsertBudgetRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}
	b, err := h.budgetService.UpsertBudget(req, familyID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": b, "message": "budget disimpan"})
}

// DeleteBudget godoc
// @Summary Hapus target budget
// @Tags budget
// @Security BearerAuth
// @Param id path string true "Budget ID"
// @Success 200 {object} map[string]string
// @Router /budgets/{id} [delete]
func (h *BudgetHandler) DeleteBudget(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	if err := h.budgetService.DeleteBudget(id, getFamilyID(c)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "budget dihapus"})
}

// ─── Shopping Items ───────────────────────────────────────────────────────────

// GetShoppingItems godoc
// @Summary Daftar shopping list
// @Tags budget
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /shopping-items [get]
func (h *BudgetHandler) GetShoppingItems(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}
	list, err := h.budgetService.GetShoppingItems(familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil data"})
	}
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}

// CreateShoppingItem godoc
// @Summary Tambah item ke shopping list
// @Tags budget
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body services.CreateShoppingItemRequest true "Shopping item payload"
// @Success 201 {object} map[string]interface{}
// @Router /shopping-items [post]
func (h *BudgetHandler) CreateShoppingItem(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	userID := getUserID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}
	var req services.CreateShoppingItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}
	item, err := h.budgetService.CreateShoppingItem(req, familyID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": item, "message": "item ditambahkan"})
}

// ToggleShoppingItem godoc
// @Summary Check/uncheck item shopping list
// @Tags budget
// @Security BearerAuth
// @Param id path string true "Item ID"
// @Success 200 {object} map[string]interface{}
// @Router /shopping-items/{id}/check [patch]
func (h *BudgetHandler) ToggleShoppingItem(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	familyID := getFamilyID(c)
	userID := getUserID(c)
	item, err := h.budgetService.ToggleShoppingItem(id, familyID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": item, "message": "item diperbarui"})
}

// DeleteShoppingItem godoc
// @Summary Hapus item dari shopping list
// @Tags budget
// @Security BearerAuth
// @Param id path string true "Item ID"
// @Success 200 {object} map[string]string
// @Router /shopping-items/{id} [delete]
func (h *BudgetHandler) DeleteShoppingItem(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	if err := h.budgetService.DeleteShoppingItem(id, getFamilyID(c)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "item dihapus"})
}

// ClearCheckedItems godoc
// @Summary Hapus semua item yang sudah dicentang
// @Tags budget
// @Security BearerAuth
// @Success 200 {object} map[string]string
// @Router /shopping-items/clear-checked [delete]
func (h *BudgetHandler) ClearCheckedItems(c *fiber.Ctx) error {
	if err := h.budgetService.ClearCheckedItems(getFamilyID(c)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "item tercentang dihapus"})
}
