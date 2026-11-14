package handlers

import (
	"errors"
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
		return familyError(c, err)
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

	family, err := h.familyService.GetFamily(familyID, getUserID(c))
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
		return familyError(c, err)
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
	actor := getUserID(c)

	member, err := h.familyService.UpdateMember(memberID, familyID, req, actor)
	if err != nil {
		return familyError(c, err)
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
	if err := h.familyService.DeleteMember(memberID, familyID, getUserID(c)); err != nil {
		return familyError(c, err)
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

func familyError(c *fiber.Ctx, err error) error {
	status := 500
	msg := "gagal memproses keluarga"
	switch {
	case errors.Is(err, services.ErrFamilyDenied):
		status = 403
		msg = err.Error()
	case errors.Is(err, services.ErrFamilyInvalid):
		status = 400
		msg = err.Error()
	case errors.Is(err, services.ErrFamilyConflict):
		status = 409
		msg = err.Error()
	}
	return c.Status(status).JSON(fiber.Map{"message": msg})
}

// UpdateFamily godoc
// @Summary Edit nama keluarga (admin)
// @Tags family
// @Security BearerAuth
// @Router /family [put]
func (h *FamilyHandler) UpdateFamily(c *fiber.Ctx) error {
	var req struct {
		Name string `json:"name"`
	}
	if err := c.BodyParser(&req); err != nil {
		return familyError(c, services.ErrFamilyInvalid)
	}
	f, err := h.familyService.UpdateFamily(getFamilyID(c), getUserID(c), req.Name, false)
	if err != nil {
		return familyError(c, err)
	}
	return c.JSON(fiber.Map{"data": f})
}

// RotateInvite godoc
// @Summary Ganti kode undangan, berlaku tujuh hari (admin)
// @Tags family
// @Security BearerAuth
// @Router /family/invite-code [post]
func (h *FamilyHandler) RotateInvite(c *fiber.Ctx) error {
	f, err := h.familyService.UpdateFamily(getFamilyID(c), getUserID(c), "", true)
	if err != nil {
		return familyError(c, err)
	}
	return c.JSON(fiber.Map{"data": f})
}

// UploadAvatar godoc
// @Summary Unggah foto profil sendiri (JPG/PNG)
// @Tags family
// @Security BearerAuth
// @Router /family/avatar [post]
func (h *FamilyHandler) UploadAvatar(c *fiber.Ctx) error {
	fh, err := c.FormFile("file")
	if err != nil {
		return familyError(c, services.ErrFamilyInvalid)
	}
	member, err := h.familyService.UploadAvatar(getUserID(c), fh)
	if err != nil {
		return familyError(c, err)
	}
	return c.JSON(fiber.Map{"data": member})
}

// Avatar godoc
// @Summary Baca foto anggota melalui akun keluarga
// @Tags family
// @Security BearerAuth
// @Router /family/members/{id}/avatar [get]
func (h *FamilyHandler) Avatar(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return familyError(c, services.ErrFamilyInvalid)
	}
	data, err := h.familyService.Avatar(id, getUserID(c), getFamilyID(c))
	if err != nil {
		return familyError(c, err)
	}
	c.Set("Cache-Control", "private, no-store")
	c.Set("X-Content-Type-Options", "nosniff")
	c.Set("Content-Type", "image/jpeg")
	return c.Send(data)
}
