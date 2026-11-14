package handlers

import (
	"errors"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"keluarga-app/backend/internal/services"
	"mime"
	"strings"
)

type DocumentHandler struct{ docService *services.DocumentService }

func NewDocumentHandler(s *services.DocumentService) *DocumentHandler {
	return &DocumentHandler{docService: s}
}
func documentError(c *fiber.Ctx, err error) error {
	status := 500
	message := "gagal memproses dokumen"
	switch {
	case errors.Is(err, services.ErrDocumentInvalid):
		status = 400
		message = err.Error()
	case errors.Is(err, services.ErrDocumentNotFound):
		status = 404
		message = err.Error()
	case errors.Is(err, services.ErrDocumentStorage), errors.Is(err, services.ErrDocumentCleanup):
		status = 503
		message = err.Error()
	}
	return c.Status(status).JSON(fiber.Map{"message": message})
}

// GetDocuments godoc
// @Summary Daftar dokumen keluarga (admin/member)
// @Tags documents
// @Security BearerAuth
// @Router /documents [get]
func (h *DocumentHandler) GetDocuments(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(400).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}
	list, err := h.docService.GetDocuments(familyID, c.Query("type"), c.Query("search"))
	if err != nil {
		return documentError(c, err)
	}
	c.Set("Cache-Control", "private, no-store")
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}
func (h *DocumentHandler) Capabilities(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"data": fiber.Map{"encryption_available": h.docService.EncryptionAvailable(), "max_file_size": services.MaxDocumentSize}})
}

// UploadDocument godoc
// @Summary Unggah PDF atau gambar, opsional AES-256-GCM
// @Tags documents
// @Security BearerAuth
// @Router /documents [post]
func (h *DocumentHandler) UploadDocument(c *fiber.Ctx) error {
	familyID, userID := getFamilyID(c), getUserID(c)
	if familyID == uuid.Nil {
		return c.Status(400).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}
	fh, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "file wajib disertakan"})
	}
	encrypted := c.FormValue("is_encrypted")
	if encrypted != "" && encrypted != "true" && encrypted != "false" {
		return documentError(c, services.ErrDocumentInvalid)
	}
	doc, _, err := h.docService.UploadSensitive(familyID, userID, c.FormValue("title"), c.FormValue("type"), c.FormValue("tags"), fh, encrypted == "true")
	if err != nil {
		return documentError(c, err)
	}
	return c.Status(201).JSON(fiber.Map{"data": fiber.Map{"id": doc.ID}, "message": "dokumen diunggah"})
}

// Update godoc
// @Summary Edit nama, kategori dan tag dokumen
// @Tags documents
// @Security BearerAuth
// @Router /documents/{id} [put]
func (h *DocumentHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return documentError(c, services.ErrDocumentInvalid)
	}
	var req struct {
		Title string `json:"title"`
		Type  string `json:"type"`
		Tags  string `json:"tags"`
	}
	if err = c.BodyParser(&req); err != nil {
		return documentError(c, services.ErrDocumentInvalid)
	}
	if err = h.docService.Update(id, getFamilyID(c), req.Title, req.Type, req.Tags); err != nil {
		return documentError(c, err)
	}
	return c.JSON(fiber.Map{"message": "dokumen diperbarui"})
}

// Download godoc
// @Summary Unduh atau pratinjau file privat melalui JWT keluarga
// @Tags documents
// @Security BearerAuth
// @Router /documents/{id}/download [get]
func (h *DocumentHandler) Download(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return documentError(c, services.ErrDocumentInvalid)
	}
	d, data, err := h.docService.Download(id, getFamilyID(c))
	if err != nil {
		return documentError(c, err)
	}
	disposition := "attachment"
	if c.Query("preview") == "true" {
		disposition = "inline"
	}
	name := strings.NewReplacer("\r", "", "\n", "").Replace(d.FileName)
	c.Set("Content-Disposition", mime.FormatMediaType(disposition, map[string]string{"filename": name}))
	c.Set("Content-Type", d.ContentType)
	c.Set("Cache-Control", "private, no-store")
	c.Set("X-Content-Type-Options", "nosniff")
	c.Set("Content-Security-Policy", "sandbox; default-src 'none'")
	return c.Send(data)
}

// DeleteDocument godoc
// @Summary Hapus dokumen; cleanup storage gagal bisa diulang
// @Tags documents
// @Security BearerAuth
// @Router /documents/{id} [delete]
func (h *DocumentHandler) DeleteDocument(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return documentError(c, services.ErrDocumentInvalid)
	}
	if err = h.docService.Delete(id, getFamilyID(c)); err != nil {
		return documentError(c, err)
	}
	return c.JSON(fiber.Map{"message": "dokumen dihapus"})
}
