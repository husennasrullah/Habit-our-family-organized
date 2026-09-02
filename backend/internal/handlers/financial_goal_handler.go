package handlers

import (
	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type FinancialGoalHandler struct {
	svc *services.FinancialGoalService
}

func NewFinancialGoalHandler(svc *services.FinancialGoalService) *FinancialGoalHandler {
	return &FinancialGoalHandler{svc: svc}
}

// GetGoals godoc
// @Summary Daftar target keuangan keluarga
// @Tags financial-goals
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /financial-goals [get]
func (h *FinancialGoalHandler) GetGoals(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}
	list, err := h.svc.GetList(familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil data"})
	}
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}

// CreateGoal godoc
// @Summary Buat target keuangan baru
// @Tags financial-goals
// @Security BearerAuth
// @Router /financial-goals [post]
func (h *FinancialGoalHandler) CreateGoal(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	userID := getUserID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}

	var req services.CreateGoalRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	goal, err := h.svc.Create(req, familyID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": goal, "message": "target dibuat"})
}

// UpdateGoal godoc
// @Summary Update target keuangan
// @Tags financial-goals
// @Security BearerAuth
// @Param id path string true "Goal ID"
// @Router /financial-goals/{id} [put]
func (h *FinancialGoalHandler) UpdateGoal(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}

	var req services.UpdateGoalRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	goal, err := h.svc.Update(id, req, getFamilyID(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": goal, "message": "target diperbarui"})
}

// AddFund godoc
// @Summary Tambah dana ke target (increment current_amount)
// @Tags financial-goals
// @Security BearerAuth
// @Param id path string true "Goal ID"
// @Router /financial-goals/{id}/progress [patch]
func (h *FinancialGoalHandler) AddFund(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}

	var req services.AddFundRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	goal, err := h.svc.AddFund(id, req, getFamilyID(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": goal, "message": "dana ditambahkan"})
}

// DeleteGoal godoc
// @Summary Hapus target keuangan
// @Tags financial-goals
// @Security BearerAuth
// @Param id path string true "Goal ID"
// @Router /financial-goals/{id} [delete]
func (h *FinancialGoalHandler) DeleteGoal(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	if err := h.svc.Delete(id, getFamilyID(c)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "target dihapus"})
}
