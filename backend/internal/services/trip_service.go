package services

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	"keluarga-app/backend/pkg/storage"

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

type CreateItineraryBudgetRequest struct {
	Label  string  `json:"label" validate:"required"`
	Amount float64 `json:"amount" validate:"required"`
}

type CreatePackingItemRequest struct {
	ItemName   string     `json:"item_name" validate:"required"`
	Category   string     `json:"category"`
	AssignedTo *uuid.UUID `json:"assigned_to"`
}

type ExpenseSplitItemRequest struct {
	MemberID  uuid.UUID `json:"member_id"`
	Amount    float64   `json:"amount"`
	IsSettled bool      `json:"is_settled"`
}

type CreateTripExpenseRequest struct {
	Title     string                    `json:"title"`
	Amount    float64                   `json:"amount"`
	Category  string                    `json:"category"`
	Date      string                    `json:"date"`
	PaidBy    *uuid.UUID                `json:"paid_by"`
	Notes     string                    `json:"notes"`
	SplitType string                    `json:"split_type"` // 'all', 'custom'
	Splits    []ExpenseSplitItemRequest `json:"splits"`
}

type TripService struct {
	repo      *repositories.TripRepository
	eventRepo *repositories.EventRepository
	storage   storage.Storage
}

func NewTripService(repo *repositories.TripRepository, eventRepo *repositories.EventRepository, storage storage.Storage) *TripService {
	return &TripService{repo: repo, eventRepo: eventRepo, storage: storage}
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

// ─── Itinerary Budget Items ───────────────────────────────────────────────────

func (s *TripService) AddItineraryBudget(itineraryID, tripID, familyID uuid.UUID, req *CreateItineraryBudgetRequest) (*models.TripItineraryBudget, error) {
	if _, err := s.repo.GetItineraryByID(itineraryID, tripID); err != nil {
		return nil, errors.New("itinerary not found")
	}
	if req.Label == "" {
		return nil, errors.New("label is required")
	}
	item := &models.TripItineraryBudget{
		ItineraryID: itineraryID,
		Label:       req.Label,
		Amount:      req.Amount,
	}
	if err := s.repo.AddItineraryBudget(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *TripService) DeleteItineraryBudget(budgetID, itineraryID, tripID, familyID uuid.UUID) error {
	if _, err := s.repo.GetItineraryByID(itineraryID, tripID); err != nil {
		return errors.New("itinerary not found")
	}
	return s.repo.DeleteItineraryBudget(budgetID, itineraryID)
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

// ─── Expenses ────────────────────────────────────────────────────────────────

func (s *TripService) AddExpense(tripID, familyID uuid.UUID, req *CreateTripExpenseRequest) (*models.TripExpense, error) {
	if req.Title == "" {
		return nil, errors.New("judul pengeluaran wajib diisi")
	}
	if req.Amount <= 0 {
		return nil, errors.New("nominal pengeluaran harus lebih besar dari 0")
	}
	if req.Date == "" {
		req.Date = time.Now().Format("2006-01-02")
	}
	if req.Category == "" {
		req.Category = "Lain-lain"
	}
	if req.SplitType == "" {
		req.SplitType = "all"
	}

	// Verify trip exists
	trip, err := s.repo.GetByID(tripID, familyID)
	if err != nil {
		return nil, errors.New("liburan tidak ditemukan")
	}

	expense := &models.TripExpense{
		TripID:    tripID,
		FamilyID:  familyID,
		Title:     req.Title,
		Amount:    req.Amount,
		Category:  req.Category,
		Date:      req.Date,
		PaidBy:    req.PaidBy,
		Notes:     req.Notes,
		SplitType: req.SplitType,
	}

	var splits []models.TripExpenseSplit
	if len(req.Splits) > 0 {
		for _, sp := range req.Splits {
			splits = append(splits, models.TripExpenseSplit{
				MemberID:  sp.MemberID,
				Amount:    sp.Amount,
				IsSettled: sp.IsSettled,
			})
		}
	} else if req.SplitType == "all" && len(trip.Members) > 0 {
		splitAmount := req.Amount / float64(len(trip.Members))
		for _, m := range trip.Members {
			isPaidByThisMember := req.PaidBy != nil && *req.PaidBy == m.ID
			splits = append(splits, models.TripExpenseSplit{
				MemberID:  m.ID,
				Amount:    splitAmount,
				IsSettled: isPaidByThisMember,
			})
		}
	}

	if err := s.repo.AddExpense(expense, splits); err != nil {
		return nil, fmt.Errorf("gagal menambahkan pengeluaran: %w", err)
	}

	return s.repo.GetExpenseByID(expense.ID, tripID, familyID)
}

func (s *TripService) UpdateExpense(expenseID, tripID, familyID uuid.UUID, req *CreateTripExpenseRequest) (*models.TripExpense, error) {
	expense, err := s.repo.GetExpenseByID(expenseID, tripID, familyID)
	if err != nil {
		return nil, errors.New("pengeluaran tidak ditemukan")
	}

	if req.Title != "" {
		expense.Title = req.Title
	}
	if req.Amount > 0 {
		expense.Amount = req.Amount
	}
	if req.Category != "" {
		expense.Category = req.Category
	}
	if req.Date != "" {
		expense.Date = req.Date
	}
	expense.PaidBy = req.PaidBy
	expense.Notes = req.Notes
	if req.SplitType != "" {
		expense.SplitType = req.SplitType
	}

	var splits []models.TripExpenseSplit
	if len(req.Splits) > 0 {
		for _, sp := range req.Splits {
			splits = append(splits, models.TripExpenseSplit{
				MemberID:  sp.MemberID,
				Amount:    sp.Amount,
				IsSettled: sp.IsSettled,
			})
		}
	}

	if err := s.repo.UpdateExpense(expense, splits); err != nil {
		return nil, fmt.Errorf("gagal memperbarui pengeluaran: %w", err)
	}

	return s.repo.GetExpenseByID(expense.ID, tripID, familyID)
}

func (s *TripService) DeleteExpense(expenseID, tripID, familyID uuid.UUID) error {
	return s.repo.DeleteExpense(expenseID, tripID, familyID)
}

func (s *TripService) ToggleExpenseSplit(splitID, expenseID, tripID, familyID uuid.UUID) (*models.TripExpenseSplit, error) {
	_, err := s.repo.GetExpenseByID(expenseID, tripID, familyID)
	if err != nil {
		return nil, errors.New("pengeluaran tidak ditemukan")
	}
	return s.repo.ToggleExpenseSplitSettled(splitID, expenseID)
}

// ─── Documents ───────────────────────────────────────────────────────────────

func (s *TripService) UploadDocument(
	tripID, familyID, userID uuid.UUID,
	title, docType, notes string,
	fh *multipart.FileHeader,
) (*models.TripDocument, error) {
	_, err := s.repo.GetByID(tripID, familyID)
	if err != nil {
		return nil, errors.New("liburan tidak ditemukan")
	}

	if title == "" {
		title = fh.Filename
	}
	if docType == "" {
		docType = "other"
	}

	f, err := fh.Open()
	if err != nil {
		return nil, fmt.Errorf("gagal membuka file: %w", err)
	}
	defer f.Close()

	ext := strings.ToLower(filepath.Ext(fh.Filename))
	key := fmt.Sprintf("trips/%s/docs/%s%s", tripID, uuid.New(), ext)
	ct := fh.Header.Get("Content-Type")
	if ct == "" {
		ct = "application/octet-stream"
	}

	if s.storage != nil {
		if _, err := s.storage.Upload(context.Background(), key, ct, f, fh.Size); err != nil {
			return nil, fmt.Errorf("gagal upload file: %w", err)
		}
	}

	doc := &models.TripDocument{
		TripID:     tripID,
		FamilyID:   familyID,
		UploadedBy: userID,
		Title:      title,
		DocType:    docType,
		FilePath:   key,
		FileName:   fh.Filename,
		FileSize:   fh.Size,
		FileType:   ct,
		Notes:      notes,
	}

	if err := s.repo.AddDocument(doc); err != nil {
		return nil, fmt.Errorf("gagal menyimpan data dokumen: %w", err)
	}

	return s.repo.GetDocumentByID(doc.ID, tripID, familyID)
}

func (s *TripService) DeleteDocument(docID, tripID, familyID uuid.UUID) error {
	doc, err := s.repo.GetDocumentByID(docID, tripID, familyID)
	if err != nil {
		return errors.New("dokumen tidak ditemukan")
	}

	if s.storage != nil && doc.FilePath != "" {
		_ = s.storage.Delete(context.Background(), doc.FilePath)
	}

	return s.repo.DeleteDocument(docID, tripID, familyID)
}
