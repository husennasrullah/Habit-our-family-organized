package handlers

import (
	"errors"

	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type KidsHandler struct{ kidsService *services.KidsService }

func NewKidsHandler(s *services.KidsService) *KidsHandler { return &KidsHandler{kidsService: s} }
func kidsResult(c *fiber.Ctx, data interface{}, err error, status int) error {
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{"message": "profil atau catatan anak tidak ditemukan"})
		}
		if errors.Is(err, services.ErrKidsValidation) {
			return c.Status(400).JSON(fiber.Map{"message": err.Error()})
		}
		return c.Status(500).JSON(fiber.Map{"message": "gagal memproses data anak"})
	}
	return c.Status(status).JSON(fiber.Map{"data": data, "message": "success"})
}
func kidPath(c *fiber.Ctx, key string) (uuid.UUID, error) {
	id, err := uuid.Parse(c.Params(key))
	if err != nil || id == uuid.Nil {
		return uuid.Nil, services.ErrKidsValidation
	}
	return id, nil
}
func (h *KidsHandler) GetKids(c *fiber.Ctx) error {
	data, err := h.kidsService.GetKids(getFamilyID(c))
	return kidsResult(c, data, err, 200)
}
func (h *KidsHandler) CreateKid(c *fiber.Ctx) error {
	var req services.CreateKidRequest
	if c.BodyParser(&req) != nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.CreateKid(req, getFamilyID(c))
	return kidsResult(c, data, err, 201)
}
func (h *KidsHandler) UpdateKid(c *fiber.Ctx) error {
	id, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	var req services.UpdateKidRequest
	if c.BodyParser(&req) != nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.UpdateKid(id, getFamilyID(c), req)
	return kidsResult(c, data, err, 200)
}
func (h *KidsHandler) DeleteKid(c *fiber.Ctx) error {
	id, err := kidPath(c, "id")
	if err == nil {
		err = h.kidsService.DeleteKid(id, getFamilyID(c))
	}
	return kidsResult(c, nil, err, 200)
}

// GetGrowth handles the authenticated family's nested growth resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/growth [get]
func (h *KidsHandler) GetGrowth(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	data, err := h.kidsService.GetGrowth(kidID, getFamilyID(c))
	return kidsResult(c, data, err, 200)
}

// AddGrowth handles the authenticated family's nested growth resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/growth [post]
func (h *KidsHandler) AddGrowth(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	var req services.CreateGrowthRequest
	if c.BodyParser(&req) != nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.AddGrowth(kidID, getFamilyID(c), req)
	return kidsResult(c, data, err, 201)
}

// UpdateGrowth handles the authenticated family's nested growth resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/growth/{record_id} [put]
func (h *KidsHandler) UpdateGrowth(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	id, err := kidPath(c, "record_id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	var req services.CreateGrowthRequest
	if c.BodyParser(&req) != nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.UpdateGrowth(id, kidID, getFamilyID(c), req)
	return kidsResult(c, data, err, 200)
}

// DeleteGrowth handles the authenticated family's nested growth resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/growth/{record_id} [delete]
func (h *KidsHandler) DeleteGrowth(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	id, err := kidPath(c, "record_id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	err = h.kidsService.DeleteGrowth(id, kidID, getFamilyID(c))
	return kidsResult(c, nil, err, 200)
}

// GetVaccines handles the authenticated family's nested vaccines resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/vaccines [get]
func (h *KidsHandler) GetVaccines(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	data, err := h.kidsService.GetVaccines(kidID, getFamilyID(c))
	return kidsResult(c, data, err, 200)
}

// AddVaccine handles the authenticated family's nested vaccines resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/vaccines [post]
func (h *KidsHandler) AddVaccine(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	var req services.CreateVaccineRequest
	if c.BodyParser(&req) != nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.AddVaccine(kidID, getFamilyID(c), req)
	return kidsResult(c, data, err, 201)
}

// UpdateVaccine handles the authenticated family's nested vaccines resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/vaccines/{record_id} [put]
func (h *KidsHandler) UpdateVaccine(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	id, err := kidPath(c, "record_id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	var req services.CreateVaccineRequest
	if c.BodyParser(&req) != nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.UpdateVaccine(id, kidID, getFamilyID(c), req)
	return kidsResult(c, data, err, 200)
}

// DeleteVaccine handles the authenticated family's nested vaccines resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/vaccines/{record_id} [delete]
func (h *KidsHandler) DeleteVaccine(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	id, err := kidPath(c, "record_id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	err = h.kidsService.DeleteVaccine(id, kidID, getFamilyID(c))
	return kidsResult(c, nil, err, 200)
}

// GetMilestones handles the authenticated family's nested milestones resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/milestones [get]
func (h *KidsHandler) GetMilestones(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	data, err := h.kidsService.GetMilestones(kidID, getFamilyID(c))
	return kidsResult(c, data, err, 200)
}

// AddMilestone handles the authenticated family's nested milestones resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/milestones [post]
func (h *KidsHandler) AddMilestone(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	var req services.CreateMilestoneRequest
	if c.BodyParser(&req) != nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.AddMilestone(kidID, getFamilyID(c), req)
	return kidsResult(c, data, err, 201)
}

// UpdateMilestone handles the authenticated family's nested milestones resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/milestones/{record_id} [put]
func (h *KidsHandler) UpdateMilestone(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	id, err := kidPath(c, "record_id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	var req services.CreateMilestoneRequest
	if c.BodyParser(&req) != nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.UpdateMilestone(id, kidID, getFamilyID(c), req)
	return kidsResult(c, data, err, 200)
}

// DeleteMilestone handles the authenticated family's nested milestones resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/milestones/{record_id} [delete]
func (h *KidsHandler) DeleteMilestone(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	id, err := kidPath(c, "record_id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	err = h.kidsService.DeleteMilestone(id, kidID, getFamilyID(c))
	return kidsResult(c, nil, err, 200)
}

// GetHealth handles the authenticated family's nested health resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/health [get]
func (h *KidsHandler) GetHealth(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	data, err := h.kidsService.GetHealth(kidID, getFamilyID(c))
	return kidsResult(c, data, err, 200)
}

// AddHealth handles the authenticated family's nested health resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/health [post]
func (h *KidsHandler) AddHealth(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	var req services.CreateHealthRequest
	if c.BodyParser(&req) != nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.AddHealth(kidID, getFamilyID(c), req)
	return kidsResult(c, data, err, 201)
}

// UpdateHealth handles the authenticated family's nested health resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/health/{record_id} [put]
func (h *KidsHandler) UpdateHealth(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	id, err := kidPath(c, "record_id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	var req services.CreateHealthRequest
	if c.BodyParser(&req) != nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.UpdateHealth(id, kidID, getFamilyID(c), req)
	return kidsResult(c, data, err, 200)
}

// DeleteHealth handles the authenticated family's nested health resource.
// @Tags kids
// @Security BearerAuth
// @Router /kids/{id}/health/{record_id} [delete]
func (h *KidsHandler) DeleteHealth(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	id, err := kidPath(c, "record_id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	err = h.kidsService.DeleteHealth(id, kidID, getFamilyID(c))
	return kidsResult(c, nil, err, 200)
}

func (h *KidsHandler) MarkVaccineGiven(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	id, err := kidPath(c, "vaccine_id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	var req services.MarkVaccineGivenRequest
	if c.BodyParser(&req) != nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.MarkVaccineGiven(id, kidID, getFamilyID(c), req)
	return kidsResult(c, data, err, 200)
}

func (h *KidsHandler) SetMilestoneAchievement(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	id, err := kidPath(c, "milestone_id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	var req struct {
		Achieved   *bool   `json:"achieved"`
		AchievedAt *string `json:"achieved_at"`
	}
	if c.BodyParser(&req) != nil || req.Achieved == nil {
		return kidsResult(c, nil, services.ErrKidsValidation, 400)
	}
	data, err := h.kidsService.SetMilestoneAchievement(id, kidID, getFamilyID(c), services.AchievementRequest{Achieved: *req.Achieved, AchievedAt: req.AchievedAt})
	return kidsResult(c, data, err, 200)
}

func (h *KidsHandler) ToggleMilestone(c *fiber.Ctx) error {
	kidID, err := kidPath(c, "id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}
	id, err := kidPath(c, "milestone_id")
	if err != nil {
		return kidsResult(c, nil, err, 400)
	}

	data, err := h.kidsService.ToggleMilestone(id, kidID, getFamilyID(c))
	return kidsResult(c, data, err, 200)
}
