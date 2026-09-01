package handlers

import (
	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type KidsHandler struct {
	kidsService *services.KidsService
}

func NewKidsHandler(kidsService *services.KidsService) *KidsHandler {
	return &KidsHandler{kidsService: kidsService}
}

// ─── Kid Profiles ─────────────────────────────────────────────────────────────

func (h *KidsHandler) GetKids(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}
	list, err := h.kidsService.GetKids(familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil data"})
	}
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}

func (h *KidsHandler) CreateKid(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}
	var req services.CreateKidRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}
	kid, err := h.kidsService.CreateKid(req, familyID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": kid, "message": "profil anak dibuat"})
}

func (h *KidsHandler) UpdateKid(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	var req services.UpdateKidRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}
	kid, err := h.kidsService.UpdateKid(id, getFamilyID(c), req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": kid, "message": "profil diperbarui"})
}

func (h *KidsHandler) DeleteKid(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	if err := h.kidsService.DeleteKid(id, getFamilyID(c)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "profil anak dihapus"})
}

// ─── Growth ───────────────────────────────────────────────────────────────────

func (h *KidsHandler) GetGrowth(c *fiber.Ctx) error {
	kidID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	list, err := h.kidsService.GetGrowth(kidID, getFamilyID(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}

func (h *KidsHandler) AddGrowth(c *fiber.Ctx) error {
	kidID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	var req services.CreateGrowthRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}
	record, err := h.kidsService.AddGrowth(kidID, getFamilyID(c), req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": record, "message": "data pertumbuhan ditambahkan"})
}

// ─── Vaccine ──────────────────────────────────────────────────────────────────

func (h *KidsHandler) GetVaccines(c *fiber.Ctx) error {
	kidID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	list, err := h.kidsService.GetVaccines(kidID, getFamilyID(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}

func (h *KidsHandler) AddVaccine(c *fiber.Ctx) error {
	kidID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	var req services.CreateVaccineRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}
	v, err := h.kidsService.AddVaccine(kidID, getFamilyID(c), req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": v, "message": "vaksin ditambahkan"})
}

func (h *KidsHandler) MarkVaccineGiven(c *fiber.Ctx) error {
	vaccineID, err := uuid.Parse(c.Params("vaccine_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	var req services.MarkVaccineGivenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}
	v, err := h.kidsService.MarkVaccineGiven(vaccineID, getFamilyID(c), req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": v, "message": "vaksin ditandai sudah diberikan"})
}

// ─── Milestone ────────────────────────────────────────────────────────────────

func (h *KidsHandler) GetMilestones(c *fiber.Ctx) error {
	kidID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	list, err := h.kidsService.GetMilestones(kidID, getFamilyID(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}

func (h *KidsHandler) AddMilestone(c *fiber.Ctx) error {
	kidID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	var req services.CreateMilestoneRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}
	m, err := h.kidsService.AddMilestone(kidID, getFamilyID(c), req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": m, "message": "milestone ditambahkan"})
}

func (h *KidsHandler) ToggleMilestone(c *fiber.Ctx) error {
	milestoneID, err := uuid.Parse(c.Params("milestone_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	m, err := h.kidsService.ToggleMilestone(milestoneID, getFamilyID(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": m, "message": "milestone diperbarui"})
}

// ─── Health ───────────────────────────────────────────────────────────────────

func (h *KidsHandler) GetHealth(c *fiber.Ctx) error {
	kidID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	list, err := h.kidsService.GetHealth(kidID, getFamilyID(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}

func (h *KidsHandler) AddHealth(c *fiber.Ctx) error {
	kidID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	var req services.CreateHealthRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}
	h2, err := h.kidsService.AddHealth(kidID, getFamilyID(c), req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": h2, "message": "catatan kesehatan ditambahkan"})
}
