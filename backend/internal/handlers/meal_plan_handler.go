package handlers

import (
	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type MealPlanHandler struct {
	svc *services.MealPlanService
}

func NewMealPlanHandler(svc *services.MealPlanService) *MealPlanHandler {
	return &MealPlanHandler{svc: svc}
}

// GetMealPlans godoc
// @Summary Ambil meal plan berdasarkan rentang tanggal
// @Tags meal-plans
// @Security BearerAuth
// @Param from query string false "YYYY-MM-DD"
// @Param to   query string false "YYYY-MM-DD"
// @Success 200 {object} map[string]interface{}
// @Router /meal-plans [get]
func (h *MealPlanHandler) GetMealPlans(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	req := services.GetMealPlansRequest{
		From: c.Query("from"),
		To:   c.Query("to"),
	}
	plans, err := h.svc.GetByDateRange(req, familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": plans, "message": "success"})
}

// CreateMealPlan godoc
// @Summary Tambah jadwal makanan baru
// @Tags meal-plans
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body services.CreateMealPlanRequest true "Payload"
// @Success 201 {object} map[string]interface{}
// @Router /meal-plans [post]
func (h *MealPlanHandler) CreateMealPlan(c *fiber.Ctx) error {
	familyID  := getFamilyID(c)
	createdBy := getUserID(c)

	var req services.CreateMealPlanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	plan, err := h.svc.Create(req, familyID, createdBy)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": plan, "message": "jadwal makanan dibuat"})
}

// UpdateMealPlan godoc
// @Summary Update jadwal makanan
// @Tags meal-plans
// @Security BearerAuth
// @Param id path string true "Meal Plan ID"
// @Router /meal-plans/{id} [put]
func (h *MealPlanHandler) UpdateMealPlan(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	id, err  := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "id tidak valid"})
	}

	var req services.UpdateMealPlanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	plan, err := h.svc.Update(id, req, familyID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": plan, "message": "jadwal makanan diperbarui"})
}

// DeleteMealPlan godoc
// @Summary Hapus jadwal makanan
// @Tags meal-plans
// @Security BearerAuth
// @Param id path string true "Meal Plan ID"
// @Router /meal-plans/{id} [delete]
func (h *MealPlanHandler) DeleteMealPlan(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	id, err  := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "id tidak valid"})
	}

	if err := h.svc.Delete(id, familyID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "jadwal makanan dihapus"})
}
