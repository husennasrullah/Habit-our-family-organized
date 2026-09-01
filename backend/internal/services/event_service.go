package services

import (
	"errors"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"

	"github.com/google/uuid"
)

// ─── DTOs ────────────────────────────────────────────────────────────────────

type CreateEventRequest struct {
	Title           string           `json:"title"            validate:"required"`
	Description     string           `json:"description"`
	StartAt         string           `json:"start_at"         validate:"required"`
	EndAt           string           `json:"end_at"           validate:"required"`
	IsAllDay        bool             `json:"is_all_day"`
	Type            models.EventType `json:"type"`
	Color           string           `json:"color"`
	IsRecurring     bool             `json:"is_recurring"`
	RecurrenceRule  string           `json:"recurrence_rule"`
	ReminderMinutes int              `json:"reminder_minutes"`
}

type UpdateEventRequest struct {
	Title           *string           `json:"title"`
	Description     *string           `json:"description"`
	StartAt         *string           `json:"start_at"`
	EndAt           *string           `json:"end_at"`
	IsAllDay        *bool             `json:"is_all_day"`
	Type            *models.EventType `json:"type"`
	Color           *string           `json:"color"`
	IsRecurring     *bool             `json:"is_recurring"`
	RecurrenceRule  *string           `json:"recurrence_rule"`
	ReminderMinutes *int              `json:"reminder_minutes"`
}

type GetEventsRequest struct {
	From   string `query:"from"`    // ISO datetime
	To     string `query:"to"`      // ISO datetime
}

// ─── Service ─────────────────────────────────────────────────────────────────

type EventService struct {
	eventRepo *repositories.EventRepository
}

func NewEventService(eventRepo *repositories.EventRepository) *EventService {
	return &EventService{eventRepo: eventRepo}
}

func (s *EventService) Create(req CreateEventRequest, familyID, createdBy uuid.UUID) (*models.Event, error) {
	if req.Title == "" {
		return nil, errors.New("judul event wajib diisi")
	}
	if req.StartAt == "" || req.EndAt == "" {
		return nil, errors.New("waktu mulai dan selesai wajib diisi")
	}

	eventType := req.Type
	if eventType == "" {
		eventType = models.EventTypeGeneral
	}
	color := req.Color
	if color == "" {
		color = "sky"
	}

	event := &models.Event{
		FamilyID:        familyID,
		CreatedBy:       createdBy,
		Title:           req.Title,
		Description:     req.Description,
		StartAt:         req.StartAt,
		EndAt:           req.EndAt,
		IsAllDay:        req.IsAllDay,
		Type:            eventType,
		Color:           color,
		IsRecurring:     req.IsRecurring,
		RecurrenceRule:  req.RecurrenceRule,
		ReminderMinutes: req.ReminderMinutes,
	}

	if err := s.eventRepo.Create(event); err != nil {
		return nil, err
	}
	return event, nil
}

func (s *EventService) GetEvents(req GetEventsRequest, familyID uuid.UUID) ([]models.Event, error) {
	from := req.From
	to := req.To
	// Default: bulan berjalan jika tidak diisi
	if from == "" {
		from = "0001-01-01T00:00:00Z"
	}
	if to == "" {
		to = "9999-12-31T23:59:59Z"
	}
	return s.eventRepo.GetByDateRange(familyID, from, to)
}

func (s *EventService) Update(id uuid.UUID, req UpdateEventRequest, familyID uuid.UUID) (*models.Event, error) {
	event, err := s.eventRepo.GetByID(id, familyID)
	if err != nil {
		return nil, errors.New("event tidak ditemukan")
	}

	if req.Title != nil {
		event.Title = *req.Title
	}
	if req.Description != nil {
		event.Description = *req.Description
	}
	if req.StartAt != nil {
		event.StartAt = *req.StartAt
	}
	if req.EndAt != nil {
		event.EndAt = *req.EndAt
	}
	if req.IsAllDay != nil {
		event.IsAllDay = *req.IsAllDay
	}
	if req.Type != nil {
		event.Type = *req.Type
	}
	if req.Color != nil {
		event.Color = *req.Color
	}
	if req.IsRecurring != nil {
		event.IsRecurring = *req.IsRecurring
	}
	if req.RecurrenceRule != nil {
		event.RecurrenceRule = *req.RecurrenceRule
	}
	if req.ReminderMinutes != nil {
		event.ReminderMinutes = *req.ReminderMinutes
	}

	if err := s.eventRepo.Update(event); err != nil {
		return nil, err
	}
	return event, nil
}

func (s *EventService) Delete(id, familyID uuid.UUID) error {
	// Pastikan event milik family ini
	_, err := s.eventRepo.GetByID(id, familyID)
	if err != nil {
		return errors.New("event tidak ditemukan")
	}
	return s.eventRepo.Delete(id, familyID)
}
