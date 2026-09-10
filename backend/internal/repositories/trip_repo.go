package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
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
		Preload("PackingItems.Assignee").
		Preload("PackingItems.Packer").
		First(&trip).Error
	if err != nil {
		return nil, err
	}
	return &trip, nil
}

func (r *TripRepository) Update(trip *models.Trip, memberIDs []uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(trip).Error; err != nil {
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
	return r.db.Create(item).Error
}

func (r *TripRepository) UpdateItinerary(item *models.TripItinerary) error {
	return r.db.Save(item).Error
}

func (r *TripRepository) GetItineraryByID(id, tripID uuid.UUID) (*models.TripItinerary, error) {
	var item models.TripItinerary
	err := r.db.Where("id = ? AND trip_id = ?", id, tripID).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *TripRepository) DeleteItinerary(id, tripID uuid.UUID) error {
	return r.db.Where("id = ? AND trip_id = ?", id, tripID).Delete(&models.TripItinerary{}).Error
}

// ─── Packing Items ───────────────────────────────────────────────────────────

func (r *TripRepository) AddPackingItem(item *models.TripPackingItem) error {
	return r.db.Create(item).Error
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
	return r.db.Save(item).Error
}

func (r *TripRepository) DeletePackingItem(id, tripID uuid.UUID) error {
	return r.db.Where("id = ? AND trip_id = ?", id, tripID).Delete(&models.TripPackingItem{}).Error
}
