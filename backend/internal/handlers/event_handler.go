package handlers

import (
	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type EventHandler struct {
	eventService *services.EventService
}

func NewEventHandler(eventService *services.EventService) *EventHandler {
	return &EventHandler{eventService: eventService}
}

// GetEvents godoc
// @Summary Ambil daftar events berdasarkan rentang tanggal
// @Tags calendar
// @Security BearerAuth
// @Produce json
// @Param from query string false "Dari tanggal (ISO 8601)"
// @Param to   query string false "Sampai tanggal (ISO 8601)"
// @Success 200 {object} map[string]interface{}
// @Router /events [get]
func (h *EventHandler) GetEvents(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "kamu belum bergabung ke keluarga manapun",
		})
	}

	req := services.GetEventsRequest{
		From: c.Query("from"),
		To:   c.Query("to"),
	}

	events, err := h.eventService.GetEvents(req, familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "gagal mengambil data event",
		})
	}

	return c.JSON(fiber.Map{"data": events, "message": "success"})
}

// CreateEvent godoc
// @Summary Buat event baru
// @Tags calendar
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body services.CreateEventRequest true "Create event payload"
// @Success 201 {object} map[string]interface{}
// @Router /events [post]
func (h *EventHandler) CreateEvent(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	userID := getUserID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "kamu belum bergabung ke keluarga manapun",
		})
	}

	var req services.CreateEventRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	event, err := h.eventService.Create(req, familyID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data":    event,
		"message": "event berhasil dibuat",
	})
}

// UpdateEvent godoc
// @Summary Update event
// @Tags calendar
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} map[string]interface{}
// @Router /events/{id} [put]
func (h *EventHandler) UpdateEvent(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}

	familyID := getFamilyID(c)
	var req services.UpdateEventRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	event, err := h.eventService.Update(id, req, familyID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"data": event, "message": "event berhasil diperbarui"})
}

// DeleteEvent godoc
// @Summary Hapus event
// @Tags calendar
// @Security BearerAuth
// @Param id path string true "Event ID"
// @Success 200 {object} map[string]string
// @Router /events/{id} [delete]
func (h *EventHandler) DeleteEvent(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}

	familyID := getFamilyID(c)
	if err := h.eventService.Delete(id, familyID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "event berhasil dihapus"})
}
