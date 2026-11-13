package services

import (
	"context"
	"errors"
	"fmt"
	"io"
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
	Title          *string     `json:"title"`
	Destination    *string     `json:"destination"`
	StartDate      *string     `json:"start_date"`
	EndDate        *string     `json:"end_date"`
	CoverImageURL  *string     `json:"cover_image_url"`
	BudgetEstimate *float64    `json:"budget_estimate"`
	Status         *string     `json:"status"`
	Notes          *string     `json:"notes"`
	MemberIDs      []uuid.UUID `json:"member_ids"`
}
type ItineraryBudgetRow struct {
	ID     uuid.UUID `json:"id"`
	Label  string    `json:"label"`
	Amount float64   `json:"amount"`
}

type CreateItineraryRequest struct {
	BudgetItems []ItineraryBudgetRow `json:"budget_items"`
	DayNumber   int                  `json:"day_number"`
	Date        *string              `json:"date"`
	TimeStart   string               `json:"time_start"`
	TimeEnd     string               `json:"time_end"`
	Title       string               `json:"title" validate:"required"`
	Location    string               `json:"location"`
	LocationURL string               `json:"location_url"`
	Notes       string               `json:"notes"`
	SortOrder   int                  `json:"sort_order"`
}

type UpdateItineraryRequest struct {
	DayNumber   *int                  `json:"day_number"`
	Date        *string               `json:"date"`
	TimeStart   *string               `json:"time_start"`
	TimeEnd     *string               `json:"time_end"`
	Title       *string               `json:"title"`
	Location    *string               `json:"location"`
	LocationURL *string               `json:"location_url"`
	Notes       *string               `json:"notes"`
	SortOrder   *int                  `json:"sort_order"`
	BudgetItems *[]ItineraryBudgetRow `json:"budget_items"`
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
	trip := &models.Trip{FamilyID: familyID, CreatedBy: userID, Title: req.Title, Destination: req.Destination, StartDate: req.StartDate, EndDate: req.EndDate, CoverImageURL: req.CoverImageURL, BudgetEstimate: req.BudgetEstimate, Status: models.TripStatus(req.Status), Notes: req.Notes}
	if trip.Status == "" {
		trip.Status = models.TripStatusPlanning
	}
	if err := validTrip(trip); err != nil {
		return nil, err
	}
	err := s.repo.Atomic(func(r *repositories.TripRepository, events *repositories.EventRepository) error {
		if err := r.ValidateMembers(familyID, req.MemberIDs); err != nil {
			return err
		}
		if trip.Status != models.TripStatusCancelled {
			event := tripEvent(trip)
			if err := events.Create(event); err != nil {
				return err
			}
			trip.EventID = &event.ID
		}
		return r.Create(trip, req.MemberIDs)
	})
	if err != nil {
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
	err := s.repo.Atomic(func(r *repositories.TripRepository, events *repositories.EventRepository) error {
		trip, err := r.Lock(id, familyID)
		if err != nil {
			return errors.New("liburan tidak ditemukan")
		}
		if req.Title != nil {
			trip.Title = *req.Title
		}
		if req.Destination != nil {
			trip.Destination = *req.Destination
		}
		if req.StartDate != nil {
			trip.StartDate = *req.StartDate
		}
		if req.EndDate != nil {
			trip.EndDate = *req.EndDate
		}
		if req.CoverImageURL != nil {
			trip.CoverImageURL = *req.CoverImageURL
		}
		if req.BudgetEstimate != nil {
			trip.BudgetEstimate = *req.BudgetEstimate
		}
		if req.Status != nil {
			trip.Status = models.TripStatus(*req.Status)
		}
		if req.Notes != nil {
			trip.Notes = *req.Notes
		}
		if err := validTrip(trip); err != nil {
			return err
		}
		if req.MemberIDs != nil {
			if err := r.ValidateMembers(familyID, req.MemberIDs); err != nil {
				return err
			}
			keep := map[uuid.UUID]bool{}
			for _, mid := range req.MemberIDs {
				keep[mid] = true
			}
			for _, e := range trip.Expenses {
				if e.PaidBy != nil && !keep[*e.PaidBy] {
					return errors.New("anggota pembayar masih dipakai pada pengeluaran")
				}
				for _, sp := range e.Splits {
					if !keep[sp.MemberID] {
						return errors.New("anggota masih dipakai pada pembagian biaya; edit pengeluaran terlebih dahulu")
					}
				}
			}
			for _, item := range trip.PackingItems {
				if item.AssignedTo != nil && !keep[*item.AssignedTo] {
					return errors.New("anggota masih bertanggung jawab atas perlengkapan")
				}
			}
		}
		for i := range trip.Itineraries {
			item := &trip.Itineraries[i]
			item.Date = nil
			if err := validateItinerary(item, trip); err != nil {
				return err
			}
			if err := r.UpdateItinerary(item); err != nil {
				return err
			}
		}
		if err := r.Update(trip, req.MemberIDs); err != nil {
			return err
		}
		event := tripEvent(trip)
		if trip.EventID != nil {
			old, err := events.GetByID(*trip.EventID, familyID)
			if err != nil {
				return errors.New("jadwal kalender terkait tidak tersedia; perubahan dibatalkan")
			}
			old.Title = event.Title
			old.Description = event.Description
			old.StartAt = event.StartAt
			old.EndAt = event.EndAt
			if trip.Status == models.TripStatusCancelled {
				if err := events.Delete(old.ID, familyID); err != nil {
					return err
				}
				trip.EventID = nil
				return r.Update(trip, nil)
			}
			return events.Update(old)
		}
		if trip.Status != models.TripStatusCancelled {
			if err := events.Create(event); err != nil {
				return err
			}
			trip.EventID = &event.ID
			return r.Update(trip, nil)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.repo.GetByID(id, familyID)
}

func (s *TripService) DeleteTrip(id, familyID uuid.UUID) error {
	return s.repo.Atomic(func(r *repositories.TripRepository, events *repositories.EventRepository) error {
		trip, err := r.Lock(id, familyID)
		if err != nil {
			return err
		}
		if trip.EventID != nil {
			if err := events.Delete(*trip.EventID, familyID); err != nil {
				return err
			}
		}
		return r.Delete(id, familyID)
	})
}

func (s *TripService) AddItinerary(tripID, familyID uuid.UUID, req *CreateItineraryRequest) (*models.TripItinerary, error) {
	rows, err := validateBudgetRows(req.BudgetItems)
	if err != nil {
		return nil, err
	}
	item := &models.TripItinerary{TripID: tripID, DayNumber: req.DayNumber, Date: req.Date, TimeStart: req.TimeStart, TimeEnd: req.TimeEnd, Title: req.Title, Location: req.Location, LocationURL: req.LocationURL, Notes: req.Notes, SortOrder: req.SortOrder}
	err = s.repo.Atomic(func(r *repositories.TripRepository, _ *repositories.EventRepository) error {
		trip, err := r.Lock(tripID, familyID)
		if err != nil {
			return errors.New("liburan tidak ditemukan")
		}
		if err := validateItinerary(item, trip); err != nil {
			return err
		}
		if err := r.AddItinerary(item); err != nil {
			return err
		}
		return r.ReplaceItineraryBudgets(item, rows)
	})
	return item, err
}

func (s *TripService) UpdateItinerary(itineraryID, tripID, familyID uuid.UUID, req *UpdateItineraryRequest) (*models.TripItinerary, error) {
	var item *models.TripItinerary
	err := s.repo.Atomic(func(r *repositories.TripRepository, _ *repositories.EventRepository) error {
		trip, err := r.Lock(tripID, familyID)
		if err != nil {
			return errors.New("liburan tidak ditemukan")
		}
		item, err = r.GetItineraryByID(itineraryID, tripID)
		if err != nil {
			return err
		}
		if req.DayNumber != nil {
			item.DayNumber = *req.DayNumber
			item.Date = nil
		}
		if req.Date != nil {
			item.Date = req.Date
		}
		if req.Title != nil {
			item.Title = *req.Title
		}
		if req.TimeStart != nil {
			item.TimeStart = *req.TimeStart
		}
		if req.TimeEnd != nil {
			item.TimeEnd = *req.TimeEnd
		}
		if req.Location != nil {
			item.Location = *req.Location
		}
		if req.LocationURL != nil {
			item.LocationURL = *req.LocationURL
		}
		if req.Notes != nil {
			item.Notes = *req.Notes
		}
		if req.SortOrder != nil {
			item.SortOrder = *req.SortOrder
		}
		if err := validateItinerary(item, trip); err != nil {
			return err
		}
		if err := r.UpdateItinerary(item); err != nil {
			return err
		}
		if req.BudgetItems != nil {
			rows, err := validateBudgetRows(*req.BudgetItems)
			if err != nil {
				return err
			}
			return r.ReplaceItineraryBudgets(item, rows)
		}
		return nil
	})
	return item, err
}

func (s *TripService) AddItineraryBudget(itineraryID, tripID, familyID uuid.UUID, req *CreateItineraryBudgetRequest) (*models.TripItineraryBudget, error) {
	rows, err := validateBudgetRows([]ItineraryBudgetRow{{Label: req.Label, Amount: req.Amount}})
	if err != nil {
		return nil, err
	}
	item := rows[0]
	err = s.repo.Atomic(func(r *repositories.TripRepository, _ *repositories.EventRepository) error {
		if _, err := r.Lock(tripID, familyID); err != nil {
			return errors.New("liburan tidak ditemukan")
		}
		if _, err := r.GetItineraryByID(itineraryID, tripID); err != nil {
			return err
		}
		item.ID = uuid.New()
		item.ItineraryID = itineraryID
		return r.AddItineraryBudget(&item)
	})
	return &item, err
}

func (s *TripService) DeleteItineraryBudget(budgetID, itineraryID, tripID, familyID uuid.UUID) error {
	return s.repo.Atomic(func(r *repositories.TripRepository, _ *repositories.EventRepository) error {
		if _, err := r.Lock(tripID, familyID); err != nil {
			return errors.New("liburan tidak ditemukan")
		}
		if _, err := r.GetItineraryByID(itineraryID, tripID); err != nil {
			return err
		}
		return r.DeleteItineraryBudget(budgetID, itineraryID)
	})
}

func (s *TripService) DeleteItinerary(itineraryID, tripID, familyID uuid.UUID) error {
	if _, err := s.repo.GetByID(tripID, familyID); err != nil {
		return errors.New("trip not found")
	}
	return s.repo.DeleteItinerary(itineraryID, tripID)
}

// ─── Packing Items ───────────────────────────────────────────────────────────

func (s *TripService) AddPackingItem(tripID, familyID uuid.UUID, req *CreatePackingItemRequest) (*models.TripPackingItem, error) {
	trip, err := s.repo.GetByID(tripID, familyID)
	if err != nil {
		return nil, errors.New("liburan tidak ditemukan")
	}
	if strings.TrimSpace(req.ItemName) == "" {
		return nil, errors.New("nama barang wajib diisi")
	}
	if req.AssignedTo != nil {
		found := false
		for _, m := range trip.Members {
			if m.ID == *req.AssignedTo {
				found = true
			}
		}
		if !found {
			return nil, errors.New("penanggung jawab harus anggota perjalanan")
		}
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
	if req.Date == "" {
		req.Date = time.Now().In(time.FixedZone("WIB", 7*3600)).Format("2006-01-02")
	}
	var expense *models.TripExpense
	err := s.repo.Atomic(func(r *repositories.TripRepository, _ *repositories.EventRepository) error {
		trip, err := r.Lock(tripID, familyID)
		if err != nil {
			return errors.New("liburan tidak ditemukan")
		}
		splits, err := validateTripExpense(req, trip)
		if err != nil {
			return err
		}
		expense = &models.TripExpense{TripID: tripID, FamilyID: familyID, Title: req.Title, Amount: req.Amount, Category: req.Category, Date: req.Date, PaidBy: req.PaidBy, Notes: req.Notes, SplitType: req.SplitType}
		return r.AddExpense(expense, splits)
	})
	if err != nil {
		return nil, err
	}
	return s.repo.GetExpenseByID(expense.ID, tripID, familyID)
}

func (s *TripService) UpdateExpense(expenseID, tripID, familyID uuid.UUID, req *CreateTripExpenseRequest) (*models.TripExpense, error) {
	err := s.repo.Atomic(func(r *repositories.TripRepository, _ *repositories.EventRepository) error {
		trip, err := r.Lock(tripID, familyID)
		if err != nil {
			return errors.New("liburan tidak ditemukan")
		}
		expense, err := r.GetExpenseByID(expenseID, tripID, familyID)
		if err != nil {
			return err
		}
		splits, err := validateTripExpense(req, trip)
		if err != nil {
			return err
		}
		// Metadata-only edits keep IDs and settled flags; changed allocations are explicit replacements.
		same := expense.Amount == req.Amount && expense.SplitType == req.SplitType && ((expense.PaidBy == nil && req.PaidBy == nil) || (expense.PaidBy != nil && req.PaidBy != nil && *expense.PaidBy == *req.PaidBy)) && len(splits) == len(expense.Splits)
		if same {
			for _, sp := range splits {
				found := false
				for _, old := range expense.Splits {
					if sp.MemberID == old.MemberID && sp.Amount == old.Amount {
						found = true
					}
				}
				if !found {
					same = false
				}
			}
		}
		if same {
			splits = nil
		}
		expense.Title = req.Title
		expense.Amount = req.Amount
		expense.Category = req.Category
		expense.Date = req.Date
		expense.PaidBy = req.PaidBy
		expense.Notes = req.Notes
		expense.SplitType = req.SplitType
		return r.UpdateExpense(expense, splits)
	})
	if err != nil {
		return nil, err
	}
	return s.repo.GetExpenseByID(expenseID, tripID, familyID)
}

func (s *TripService) DeleteExpense(expenseID, tripID, familyID uuid.UUID) error {
	return s.repo.DeleteExpense(expenseID, tripID, familyID)
}

func (s *TripService) ToggleExpenseSplit(splitID, expenseID, tripID, familyID uuid.UUID) (*models.TripExpenseSplit, error) {
	var result *models.TripExpenseSplit
	err := s.repo.Atomic(func(r *repositories.TripRepository, _ *repositories.EventRepository) error {
		if _, err := r.Lock(tripID, familyID); err != nil {
			return err
		}
		expense, err := r.GetExpenseByID(expenseID, tripID, familyID)
		if err != nil {
			return err
		}
		for _, sp := range expense.Splits {
			if sp.ID == splitID && (sp.Amount == 0 || (expense.PaidBy != nil && sp.MemberID == *expense.PaidBy)) {
				return errors.New("bagian pembayar atau nominal nol tidak perlu pelunasan")
			}
		}
		result, err = r.ToggleExpenseSplitSettled(splitID, expenseID)
		return err
	})
	return result, err
}

func (s *TripService) UploadDocument(
	tripID, familyID, userID uuid.UUID,
	title, docType, notes string,
	fh *multipart.FileHeader,
) (*models.TripDocument, error) {
	if s.storage == nil {
		return nil, errors.New("storage tidak tersedia; dokumen belum diupload")
	}
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

	if fh.Size <= 0 || fh.Size > 10*1024*1024 {
		return nil, errors.New("ukuran dokumen harus 1 byte sampai 10 MB")
	}
	switch docType {
	case "ticket", "hotel", "insurance", "visa", "other":
	default:
		return nil, errors.New("jenis dokumen tidak valid")
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
		if s.storage != nil {
			_ = s.storage.Delete(context.Background(), key)
		}
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

func (s *TripService) DocumentStream(docID, tripID, familyID uuid.UUID) (io.ReadCloser, string, string, int64, error) {
	doc, err := s.repo.GetDocumentByID(docID, tripID, familyID)
	if err != nil {
		return nil, "", "", 0, errors.New("dokumen tidak ditemukan")
	}
	if s.storage == nil {
		return nil, "", "", 0, errors.New("storage tidak tersedia")
	}
	stream, contentType, size, err := s.storage.GetObject(context.Background(), doc.FilePath)
	return stream, contentType, doc.FileName, size, err
}
