package handlers

import (
	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type DocumentHandler struct {
	docService *services.DocumentService
}

func NewDocumentHandler(docService *services.DocumentService) *DocumentHandler {
	return &DocumentHandler{docService: docService}
}

func (h *DocumentHandler) GetDocuments(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}
	list, err := h.docService.GetDocuments(familyID, c.Query("type"), c.Query("search"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil data"})
	}
	return c.JSON(fiber.Map{"data": list, "message": "success"})
}

func (h *DocumentHandler) UploadDocument(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	userID   := getUserID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}

	fh, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "file wajib disertakan"})
	}

	doc, url, err := h.docService.Upload(
		familyID, userID,
		c.FormValue("title"),
		c.FormValue("type"),
		c.FormValue("tags"),
		fh,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data": fiber.Map{
			"id": doc.ID, "title": doc.Title, "type": doc.Type,
			"file_size": doc.FileSize, "tags": doc.Tags, "url": url,
			"created_at": doc.CreatedAt,
		},
		"message": "dokumen diupload",
	})
}

func (h *DocumentHandler) DeleteDocument(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}
	if err := h.docService.Delete(id, getFamilyID(c)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "dokumen dihapus"})
}
