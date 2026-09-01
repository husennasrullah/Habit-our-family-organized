package handlers

import (
	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type FamilyHandler struct {
	familyService *services.FamilyService
}

func NewFamilyHandler(familyService *services.FamilyService) *FamilyHandler {
	return &FamilyHandler{familyService: familyService}
}

// CreateFamily godoc
// @Summary Buat keluarga baru
// @Tags family
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body services.CreateFamilyRequest true "Create family payload"
// @Success 201 {object} map[string]interface{}
// @Router /family [post]
func (h *FamilyHandler) CreateFamily(c *fiber.Ctx) error {
	var req services.CreateFamilyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}
	if req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "nama keluarga wajib diisi"})
	}

	memberID := getUserID(c)
	family, err := h.familyService.CreateFamily(req, memberID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data":    family,
		"message": "keluarga berhasil dibuat",
	})
}

// GetFamily godoc
// @Summary Ambil detail keluarga
// @Tags family
// @Security BearerAuth
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /family [get]
func (h *FamilyHandler) GetFamily(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "kamu belum bergabung ke keluarga manapun",
		})
	}

	family, err := h.familyService.GetFamily(familyID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "keluarga tidak ditemukan"})
	}

	return c.JSON(fiber.Map{"data": family, "message": "success"})
}

// JoinFamily godoc
// @Summary Gabung keluarga via invite code
// @Tags family
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body services.JoinFamilyRequest true "Join family payload"
// @Success 200 {object} map[string]interface{}
// @Router /family/join [post]
func (h *FamilyHandler) JoinFamily(c *fiber.Ctx) error {
	var req services.JoinFamilyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}
	if req.InviteCode == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "invite code wajib diisi"})
	}

	memberID := getUserID(c)
	family, err := h.familyService.JoinFamily(req, memberID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"data": family, "message": "berhasil bergabung ke keluarga"})
}

// GetMembers godoc
// @Summary Daftar anggota keluarga
// @Tags family
// @Security BearerAuth
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /family/members [get]
func (h *FamilyHandler) GetMembers(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "kamu belum bergabung ke keluarga manapun",
		})
	}

	members, err := h.familyService.GetMembers(familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil data"})
	}

	return c.JSON(fiber.Map{"data": members, "message": "success"})
}

// UpdateMember godoc
// @Summary Update profil anggota keluarga
// @Tags family
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Member ID"
// @Success 200 {object} map[string]interface{}
// @Router /family/members/{id} [put]
func (h *FamilyHandler) UpdateMember(c *fiber.Ctx) error {
	memberIDStr := c.Params("id")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}

	var req services.UpdateMemberRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	familyID := getFamilyID(c)
	callerRole, _ := c.Locals("role").(string)

	member, err := h.familyService.UpdateMember(memberID, familyID, req, callerRole)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"data": member, "message": "profil berhasil diperbarui"})
}

// DeleteMember godoc
// @Summary Hapus anggota dari keluarga (admin only)
// @Tags family
// @Security BearerAuth
// @Param id path string true "Member ID"
// @Success 200 {object} map[string]string
// @Router /family/members/{id} [delete]
func (h *FamilyHandler) DeleteMember(c *fiber.Ctx) error {
	memberIDStr := c.Params("id")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}

	familyID := getFamilyID(c)
	if err := h.familyService.DeleteMember(memberID, familyID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal menghapus member"})
	}

	return c.JSON(fiber.Map{"message": "anggota berhasil dihapus"})
}

// ─── Context helpers (reuse di semua handler) ─────────────────────────────────

func getUserID(c *fiber.Ctx) uuid.UUID {
	id, _ := c.Locals("user_id").(uuid.UUID)
	return id
}

func getFamilyID(c *fiber.Ctx) uuid.UUID {
	id, _ := c.Locals("family_id").(uuid.UUID)
	return id
}
