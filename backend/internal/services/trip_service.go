package services

import (
	"errors"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"

	"github.com/google/uuid"
)

type CreateTripRequest struct {
	Title          string      `json:"title" validate:"required"`
	Destination    string      `json:"destination" validate:"required"`
	StartDate      string      `json:"start_date" validate:"required"`
	EndDate        string      `json:"end_date" validate:"required"`
	CoverImageURL  string      `json:"cover_image_url"`
	BudgetEstimate float64     `json:"budget_estimate"`
	Status         string      `json:"status"`
	Notes          string      `json:"notes"`
	MemberIDs      []uuid.UUID `json:"member_ids"`
}

type UpdateTripRequest struct {
	Title          string      `json:"title"`
	Destination    string      `json:"destination"`
	StartDate      string      `json:"start_date"`
	EndDate        string      `json:"end_date"`
	CoverImageURL  string      `json:"cover_image_url"`
	BudgetEstimate float64     `json:"budget_estimate"`
	Status         string      `json:"status"`
	Notes          string      `json:"notes"`
	MemberIDs      []uuid.UUID `json:"member_ids"`
}

type CreateItineraryRequest struct {
	DayNumber   int     `json:"day_number"`
	Date        *string `json:"date"`
	TimeStart   string  `json:"time_start"`
	TimeEnd     string  `json:"time_end"`
	Title       string  `json:"title" validate:"required"`
	Location    string  `json:"location"`
	LocationURL string  `json:"location_url"`
	Notes       string  `json:"notes"`
	SortOrder   int     `json:"sort_order"`
}

type UpdateItineraryRequest struct {
	DayNumber   int     `json:"day_number"`
	Date        *string `json:"date"`
	TimeStart   string  `json:"time_start"`
	TimeEnd     string  `json:"time_end"`
	Title       string  `json:"title"`
	Location    string  `json:"location"`
	LocationURL string  `json:"location_url"`
	Notes       string  `json:"notes"`
	SortOrder   int     `json:"sort_order"`
}

type CreatePackingItemRequest struct {
	ItemName   string     `json:"item_name" validate:"required"`
	Category   string     `json:"category"`
	AssignedTo *uuid.UUID `json:"assigned_to"`
}

type TripService struct {
	repo      *repositories.TripRepository
	eventRepo *repositories.EventRepository
}

func NewTripService(repo *repositories.TripRepository, eventRepo *repositories.EventRepository) *TripService {
	return &TripService{repo: repo, eventRepo: eventRepo}
}

// ─── Trips ────────────────────────────────────────────────────────────────────

func (s *TripService) CreateTrip(req *CreateTripRequest, familyID, userID uuid.UUID) (*models.Trip, error) {
	if req.Title == "" || req.Destination == "" || req.StartDate == "" || req.EndDate == "" {
		return nil, errors.New("title, destination, start_date, and end_date are required")
	}

	status := models.TripStatusPlanning
	if req.Status != "" {
		status = models.TripStatus(req.Status)
	}

	// 1. Buat event kalender otomatis bertipe "vacation"
	event := &models.Event{
		FamilyID:    familyID,
		CreatedBy:   userID,
		Title:       "🏖️ " + req.Title + " (" + req.Destination + ")",
		Description: req.Notes,
		StartAt:     req.StartDate + "T00:00:00Z",
		EndAt:       req.EndDate + "T23:59:59Z",
		IsAllDay:    true,
		Type:        models.EventTypeVacation,
		Color:       "emerald",
	}
	if err := s.eventRepo.Create(event); err == nil {
		// Event berhasil dibuat
	}

	var eventID *uuid.UUID
	if event.ID != uuid.Nil {
		eventID = &event.ID
	}

	trip := &models.Trip{
		FamilyID:       familyID,
		CreatedBy:      userID,
		Title:          req.Title,
		Destination:    req.Destination,
		StartDate:      req.StartDate,
		EndDate:        req.EndDate,
		CoverImageURL:  req.CoverImageURL,
		BudgetEstimate: req.BudgetEstimate,
		Status:         status,
		Notes:          req.Notes,
		EventID:        eventID,
	}

	if err := s.repo.Create(trip, req.MemberIDs); err != nil {
		return nil, err
	}

	return s.repo.GetByID(trip.ID, familyID)
}

func (s *TripService) GetTrips(familyID uuid.UUID) ([]models.Trip, error) {
	return s.repo.GetByFamily(familyID)
}

func (s *TripService) GetTripByID(id, familyID uuid.UUID) (*models.Trip, error) {
	return s.repo.GetByID(id, familyID)
}

func (s *TripService) UpdateTrip(id, familyID uuid.UUID, req *UpdateTripRequest) (*models.Trip, error) {
	trip, err := s.repo.GetByID(id, familyID)
	if err != nil {
		return nil, err
	}

	if req.Title != "" {
		trip.Title = req.Title
	}
	if req.Destination != "" {
		trip.Destination = req.Destination
	}
	if req.StartDate != "" {
		trip.StartDate = req.StartDate
	}
	if req.EndDate != "" {
		trip.EndDate = req.EndDate
	}
	if req.CoverImageURL != "" {
		trip.CoverImageURL = req.CoverImageURL
	}
	if req.BudgetEstimate > 0 {
		trip.BudgetEstimate = req.BudgetEstimate
	}
	if req.Status != "" {
		trip.Status = models.TripStatus(req.Status)
	}
	if req.Notes != "" {
		trip.Notes = req.Notes
	}

	if err := s.repo.Update(trip, req.MemberIDs); err != nil {
		return nil, err
	}

	// Sync event kalender terkait jika ada
	if trip.EventID != nil {
		if ev, err := s.eventRepo.GetByID(*trip.EventID, familyID); err == nil && ev != nil {
			ev.Title = "🏖️ " + trip.Title + " (" + trip.Destination + ")"
			ev.Description = trip.Notes
			ev.StartAt = trip.StartDate + "T00:00:00Z"
			ev.EndAt = trip.EndDate + "T23:59:59Z"
			_ = s.eventRepo.Update(ev)
		}
	}

	return s.repo.GetByID(id, familyID)
}

func (s *TripService) DeleteTrip(id, familyID uuid.UUID) error {
	trip, err := s.repo.GetByID(id, familyID)
	if err == nil && trip != nil && trip.EventID != nil {
		// Hapus juga jadwal di kalender
		_ = s.eventRepo.Delete(*trip.EventID, familyID)
	}
	return s.repo.Delete(id, familyID)
}

// ─── Itineraries ─────────────────────────────────────────────────────────────

func (s *TripService) AddItinerary(tripID, familyID uuid.UUID, req *CreateItineraryRequest) (*models.TripItinerary, error) {
	if _, err := s.repo.GetByID(tripID, familyID); err != nil {
		return nil, errors.New("trip not found")
	}

	dayNum := req.DayNumber
	if dayNum <= 0 {
		dayNum = 1
	}

	item := &models.TripItinerary{
		TripID:      tripID,
		DayNumber:   dayNum,
		Date:        req.Date,
		TimeStart:   req.TimeStart,
		TimeEnd:     req.TimeEnd,
		Title:       req.Title,
		Location:    req.Location,
		LocationURL: req.LocationURL,
		Notes:       req.Notes,
		SortOrder:   req.SortOrder,
	}

	if err := s.repo.AddItinerary(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *TripService) UpdateItinerary(itineraryID, tripID, familyID uuid.UUID, req *UpdateItineraryRequest) (*models.TripItinerary, error) {
	if _, err := s.repo.GetByID(tripID, familyID); err != nil {
		return nil, errors.New("trip not found")
	}

	item, err := s.repo.GetItineraryByID(itineraryID, tripID)
	if err != nil {
		return nil, err
	}

	if req.DayNumber > 0 {
		item.DayNumber = req.DayNumber
	}
	if req.Date != nil {
		item.Date = req.Date
	}
	if req.TimeStart != "" {
		item.TimeStart = req.TimeStart
	}
	if req.TimeEnd != "" {
		item.TimeEnd = req.TimeEnd
	}
	if req.Title != "" {
		item.Title = req.Title
	}
	if req.Location != "" {
		item.Location = req.Location
	}
	if req.LocationURL != "" {
		item.LocationURL = req.LocationURL
	}
	if req.Notes != "" {
		item.Notes = req.Notes
	}
	item.SortOrder = req.SortOrder

	if err := s.repo.UpdateItinerary(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *TripService) DeleteItinerary(itineraryID, tripID, familyID uuid.UUID) error {
	if _, err := s.repo.GetByID(tripID, familyID); err != nil {
		return errors.New("trip not found")
	}
	return s.repo.DeleteItinerary(itineraryID, tripID)
}

// ─── Packing Items ───────────────────────────────────────────────────────────

func (s *TripService) AddPackingItem(tripID, familyID uuid.UUID, req *CreatePackingItemRequest) (*models.TripPackingItem, error) {
	if _, err := s.repo.GetByID(tripID, familyID); err != nil {
		return nil, errors.New("trip not found")
	}

	cat := req.Category
	if cat == "" {
		cat = "General"
	}

	item := &models.TripPackingItem{
		TripID:     tripID,
		ItemName:   req.ItemName,
		Category:   cat,
		AssignedTo: req.AssignedTo,
	}

	if err := s.repo.AddPackingItem(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *TripService) TogglePackingItem(itemID, tripID, familyID, userID uuid.UUID) (*models.TripPackingItem, error) {
	if _, err := s.repo.GetByID(tripID, familyID); err != nil {
		return nil, errors.New("trip not found")
	}

	item, err := s.repo.GetPackingItemByID(itemID, tripID)
	if err != nil {
		return nil, err
	}

	item.IsPacked = !item.IsPacked
	if item.IsPacked {
		item.PackedBy = &userID
	} else {
		item.PackedBy = nil
	}

	if err := s.repo.UpdatePackingItem(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *TripService) DeletePackingItem(itemID, tripID, familyID uuid.UUID) error {
	if _, err := s.repo.GetByID(tripID, familyID); err != nil {
		return errors.New("trip not found")
	}
	return s.repo.DeletePackingItem(itemID, tripID)
}
