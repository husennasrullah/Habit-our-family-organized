package repositories

import (
	"keluarga-app/backend/internal/models"

	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TripRepository struct {
	db *gorm.DB
}

func NewTripRepository(db *gorm.DB) *TripRepository {
	return &TripRepository{db: db}
}

// ─── Trips ────────────────────────────────────────────────────────────────────

func (r *TripRepository) Create(trip *models.Trip, memberIDs []uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(trip).Error; err != nil {
			return err
		}
		if len(memberIDs) > 0 {
			var members []models.TripMember
			for _, mid := range memberIDs {
				members = append(members, models.TripMember{
					TripID:   trip.ID,
					MemberID: mid,
				})
			}
			if err := tx.Create(&members).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *TripRepository) GetByFamily(familyID uuid.UUID) ([]models.Trip, error) {
	var trips []models.Trip
	err := r.db.Where("family_id = ?", familyID).
		Preload("Members").
		Preload("Itineraries", func(db *gorm.DB) *gorm.DB {
			return db.Order("day_number ASC, sort_order ASC, time_start ASC")
		}).
		Preload("Itineraries.BudgetItems").
		Preload("PackingItems").
		Order("start_date DESC").
		Find(&trips).Error
	return trips, err
}

func (r *TripRepository) GetByID(id, familyID uuid.UUID) (*models.Trip, error) {
	var trip models.Trip
	err := r.db.Where("id = ? AND family_id = ?", id, familyID).
		Preload("Members").
		Preload("Itineraries", func(db *gorm.DB) *gorm.DB {
			return db.Order("day_number ASC, sort_order ASC, time_start ASC")
		}).
		Preload("Itineraries.BudgetItems").
		Preload("PackingItems.Assignee").
		Preload("PackingItems.Packer").
		Preload("Expenses", func(db *gorm.DB) *gorm.DB {
			return db.Order("date DESC, created_at DESC")
		}).
		Preload("Expenses.Payer").
		Preload("Expenses.Splits.Member").
		Preload("Documents", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Preload("Documents.Uploader").
		First(&trip).Error
	if err != nil {
		return nil, err
	}
	return &trip, nil
}

func (r *TripRepository) Update(trip *models.Trip, memberIDs []uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit(clause.Associations).Save(trip).Error; err != nil {
			return err
		}
		// Sync members if provided
		if memberIDs != nil {
			if err := tx.Where("trip_id = ?", trip.ID).Delete(&models.TripMember{}).Error; err != nil {
				return err
			}
			if len(memberIDs) > 0 {
				var members []models.TripMember
				for _, mid := range memberIDs {
					members = append(members, models.TripMember{
						TripID:   trip.ID,
						MemberID: mid,
					})
				}
				if err := tx.Create(&members).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *TripRepository) Delete(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.Trip{}).Error
}

// ─── Itineraries ─────────────────────────────────────────────────────────────

func (r *TripRepository) AddItinerary(item *models.TripItinerary) error {
	return r.db.Omit(clause.Associations).Create(item).Error
}

func (r *TripRepository) UpdateItinerary(item *models.TripItinerary) error {
	return r.db.Omit(clause.Associations).Save(item).Error
}

func (r *TripRepository) GetItineraryByID(id, tripID uuid.UUID) (*models.TripItinerary, error) {
	var item models.TripItinerary
	err := r.db.Where("id = ? AND trip_id = ?", id, tripID).
		Preload("BudgetItems").
		First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *TripRepository) DeleteItinerary(id, tripID uuid.UUID) error {
	return r.db.Where("id = ? AND trip_id = ?", id, tripID).Delete(&models.TripItinerary{}).Error
}

// ─── Itinerary Budget Items ───────────────────────────────────────────────────

func (r *TripRepository) AddItineraryBudget(item *models.TripItineraryBudget) error {
	return r.db.Omit(clause.Associations).Create(item).Error
}

func (r *TripRepository) DeleteItineraryBudget(id, itineraryID uuid.UUID) error {
	return r.db.Where("id = ? AND itinerary_id = ?", id, itineraryID).Delete(&models.TripItineraryBudget{}).Error
}

// ─── Packing Items ───────────────────────────────────────────────────────────

func (r *TripRepository) AddPackingItem(item *models.TripPackingItem) error {
	return r.db.Omit(clause.Associations).Create(item).Error
}

func (r *TripRepository) GetPackingItemByID(id, tripID uuid.UUID) (*models.TripPackingItem, error) {
	var item models.TripPackingItem
	err := r.db.Where("id = ? AND trip_id = ?", id, tripID).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *TripRepository) UpdatePackingItem(item *models.TripPackingItem) error {
	return r.db.Omit(clause.Associations).Save(item).Error
}

func (r *TripRepository) DeletePackingItem(id, tripID uuid.UUID) error {
	return r.db.Where("id = ? AND trip_id = ?", id, tripID).Delete(&models.TripPackingItem{}).Error
}

// ─── Expenses ────────────────────────────────────────────────────────────────

func (r *TripRepository) AddExpense(expense *models.TripExpense, splits []models.TripExpenseSplit) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(expense).Error; err != nil {
			return err
		}
		if len(splits) > 0 {
			for i := range splits {
				splits[i].ExpenseID = expense.ID
			}
			if err := tx.Create(&splits).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *TripRepository) GetExpenseByID(id, tripID, familyID uuid.UUID) (*models.TripExpense, error) {
	var expense models.TripExpense
	err := r.db.Where("id = ? AND trip_id = ? AND family_id = ?", id, tripID, familyID).
		Preload("Payer").
		Preload("Splits.Member").
		First(&expense).Error
	if err != nil {
		return nil, err
	}
	return &expense, nil
}

func (r *TripRepository) UpdateExpense(expense *models.TripExpense, splits []models.TripExpenseSplit) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit(clause.Associations).Save(expense).Error; err != nil {
			return err
		}
		if splits == nil {
			return nil
		}
		if err := tx.Where("expense_id = ?", expense.ID).Delete(&models.TripExpenseSplit{}).Error; err != nil {
			return err
		}
		if len(splits) > 0 {
			for i := range splits {
				splits[i].ExpenseID = expense.ID
			}
			if err := tx.Create(&splits).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *TripRepository) DeleteExpense(id, tripID, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND trip_id = ? AND family_id = ?", id, tripID, familyID).Delete(&models.TripExpense{}).Error
}

func (r *TripRepository) ToggleExpenseSplitSettled(splitID, expenseID uuid.UUID) (*models.TripExpenseSplit, error) {
	var split models.TripExpenseSplit
	err := r.db.Where("id = ? AND expense_id = ?", splitID, expenseID).First(&split).Error
	if err != nil {
		return nil, err
	}
	split.IsSettled = !split.IsSettled
	if err := r.db.Save(&split).Error; err != nil {
		return nil, err
	}
	return &split, nil
}

// ─── Documents ───────────────────────────────────────────────────────────────

func (r *TripRepository) AddDocument(doc *models.TripDocument) error {
	return r.db.Create(doc).Error
}

func (r *TripRepository) GetDocumentByID(id, tripID, familyID uuid.UUID) (*models.TripDocument, error) {
	var doc models.TripDocument
	err := r.db.Where("id = ? AND trip_id = ? AND family_id = ?", id, tripID, familyID).
		Preload("Uploader").
		First(&doc).Error
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

func (r *TripRepository) DeleteDocument(id, tripID, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND trip_id = ? AND family_id = ?", id, tripID, familyID).Delete(&models.TripDocument{}).Error
}

// Atomic keeps related trip/calendar/itinerary writes in one database transaction.
func (r *TripRepository) Atomic(fn func(*TripRepository, *EventRepository) error) error {
	return r.db.Transaction(func(tx *gorm.DB) error { return fn(NewTripRepository(tx), NewEventRepository(tx)) })
}
func (r *TripRepository) Lock(id, familyID uuid.UUID) (*models.Trip, error) {
	var row models.Trip
	if err := r.db.Clauses(clause.Locking{Strength: "UPDATE"}).First(&row, "id = ? AND family_id = ?", id, familyID).Error; err != nil {
		return nil, err
	}
	return r.GetByID(id, familyID)
}
func (r *TripRepository) ValidateMembers(familyID uuid.UUID, ids []uuid.UUID) error {
	seen := map[uuid.UUID]bool{}
	for _, id := range ids {
		if id == uuid.Nil || seen[id] {
			return errors.New("anggota tidak valid atau berulang")
		}
		seen[id] = true
	}
	if len(ids) == 0 {
		return nil
	}
	var count int64
	if err := r.db.Model(&models.FamilyMember{}).Where("family_id = ? AND id IN ?", familyID, ids).Count(&count).Error; err != nil {
		return err
	}
	if count != int64(len(ids)) {
		return errors.New("anggota harus berasal dari keluarga yang sama")
	}
	return nil
}
func (r *TripRepository) ReplaceItineraryBudgets(item *models.TripItinerary, rows []models.TripItineraryBudget) error {
	// IDs supplied by clients may only refer to this itinerary; preserve IDs for edited rows.
	keep := []uuid.UUID{}
	for i := range rows {
		rows[i].ItineraryID = item.ID
		if rows[i].ID != uuid.Nil {
			var old models.TripItineraryBudget
			if err := r.db.First(&old, "id = ? AND itinerary_id = ?", rows[i].ID, item.ID).Error; err != nil {
				return errors.New("rincian biaya tidak ditemukan pada kegiatan ini")
			}
			if err := r.db.Model(&old).Updates(map[string]interface{}{"label": rows[i].Label, "amount": rows[i].Amount}).Error; err != nil {
				return err
			}
		} else {
			rows[i].ID = uuid.New()
			if err := r.db.Create(&rows[i]).Error; err != nil {
				return err
			}
		}
		keep = append(keep, rows[i].ID)
	}
	q := r.db.Where("itinerary_id = ?", item.ID)
	if len(keep) > 0 {
		q = q.Where("id NOT IN ?", keep)
	}
	if err := q.Delete(&models.TripItineraryBudget{}).Error; err != nil {
		return err
	}
	item.BudgetItems = rows
	return nil
}
