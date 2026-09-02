package handlers

import (
	"fmt"
	"io"
	"strconv"

	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type MemoryHandler struct {
	memoryService *services.MemoryService
}

func NewMemoryHandler(memoryService *services.MemoryService) *MemoryHandler {
	return &MemoryHandler{memoryService: memoryService}
}

// GetMemories godoc
// @Summary Daftar kenangan keluarga
// @Tags memories
// @Security BearerAuth
// @Param year       query int  false "Filter tahun"
// @Param month      query int  false "Filter bulan"
// @Param is_favorite query bool false "Filter favorit"
// @Success 200 {object} map[string]interface{}
// @Router /memories [get]
func (h *MemoryHandler) GetMemories(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}

	req := services.MemoryListRequest{}
	if y, err := strconv.Atoi(c.Query("year")); err == nil && y > 0 {
		req.Year = y
	}
	if m, err := strconv.Atoi(c.Query("month")); err == nil && m > 0 {
		req.Month = m
	}
	if fav := c.Query("is_favorite"); fav == "true" {
		t := true
		req.IsFavorite = &t
	}

	list, err := h.memoryService.GetList(familyID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil data"})
	}
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}

// GetMemory godoc
// @Summary Detail satu kenangan (dengan semua foto)
// @Tags memories
// @Security BearerAuth
// @Param id path string true "Memory ID"
// @Success 200 {object} map[string]interface{}
// @Router /memories/{id} [get]
func (h *MemoryHandler) GetMemory(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	mem, err := h.memoryService.GetByID(id, getFamilyID(c))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": mem, "message": "success"})
}

// CreateMemory godoc
// @Summary Buat kenangan baru
// @Tags memories
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body services.CreateMemoryRequest true "Memory payload"
// @Success 201 {object} map[string]interface{}
// @Router /memories [post]
func (h *MemoryHandler) CreateMemory(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	userID := getUserID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}

	var req services.CreateMemoryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	mem, err := h.memoryService.Create(req, familyID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": mem, "message": "kenangan dibuat"})
}

// UpdateMemory godoc
// @Summary Update kenangan
// @Tags memories
// @Security BearerAuth
// @Param id path string true "Memory ID"
// @Success 200 {object} map[string]interface{}
// @Router /memories/{id} [put]
func (h *MemoryHandler) UpdateMemory(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}

	var req services.UpdateMemoryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	mem, err := h.memoryService.Update(id, req, getFamilyID(c))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": mem, "message": "kenangan diperbarui"})
}

// DeleteMemory godoc
// @Summary Hapus kenangan beserta semua fotonya
// @Tags memories
// @Security BearerAuth
// @Param id path string true "Memory ID"
// @Success 200 {object} map[string]string
// @Router /memories/{id} [delete]
func (h *MemoryHandler) DeleteMemory(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	if err := h.memoryService.Delete(id, getFamilyID(c)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "kenangan dihapus"})
}

// UploadPhotos godoc
// @Summary Upload foto ke kenangan (multipart/form-data, field: photos)
// @Tags memories
// @Security BearerAuth
// @Param id     path  string true  "Memory ID"
// @Param photos formData file true "File foto (bisa multiple)"
// @Success 201 {object} map[string]interface{}
// @Router /memories/{id}/photos [post]
func (h *MemoryHandler) UploadPhotos(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	familyID := getFamilyID(c)

	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "form tidak valid"})
	}

	files := form.File["photos"]
	if len(files) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "tidak ada file yang diupload"})
	}

	results, err := h.memoryService.UploadPhotos(id, familyID, files)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": results, "message": "foto diupload"})
}

// ServePhoto godoc
// @Summary Proxy foto dari storage — hindari expose MinIO langsung ke publik
// @Tags memories
// @Security BearerAuth
// @Param id       path string true "Memory ID"
// @Param photo_id path string true "Photo ID"
// @Router /memories/{id}/photos/{photo_id}/serve [get]
func (h *MemoryHandler) ServePhoto(c *fiber.Ctx) error {
	photoID, err := uuid.Parse(c.Params("photo_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "photo ID tidak valid"})
	}
	r, contentType, size, err := h.memoryService.GetPhotoStream(photoID, getFamilyID(c))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": err.Error()})
	}
	// Baca seluruh konten ke memory dulu agar stream tidak ditutup prematur
	data, err := io.ReadAll(r)
	r.Close()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal membaca foto"})
	}

	c.Set("Content-Type", contentType)
	c.Set("Cache-Control", "private, max-age=3600")
	c.Set("Content-Length", fmt.Sprintf("%d", size))
	return c.Send(data)
}

// DeletePhoto godoc
// @Summary Hapus satu foto dari kenangan
// @Tags memories
// @Security BearerAuth
// @Param id       path string true "Memory ID"
// @Param photo_id path string true "Photo ID"
// @Success 200 {object} map[string]string
// @Router /memories/{id}/photos/{photo_id} [delete]
func (h *MemoryHandler) DeletePhoto(c *fiber.Ctx) error {
	photoID, err := uuid.Parse(c.Params("photo_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "photo ID tidak valid"})
	}
	if err := h.memoryService.DeletePhoto(photoID, getFamilyID(c)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "foto dihapus"})
}
