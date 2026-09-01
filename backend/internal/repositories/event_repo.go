package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) Create(e *models.Event) error {
	return r.db.Create(e).Error
}

func (r *EventRepository) GetByID(id, familyID uuid.UUID) (*models.Event, error) {
	var e models.Event
	err := r.db.First(&e, "id = ? AND family_id = ?", id, familyID).Error
	if err != nil {
		return nil, err
	}
	return &e, nil
}

// GetByDateRange — ambil events dalam rentang tanggal (format ISO: "2006-01-02T15:04:05Z")
func (r *EventRepository) GetByDateRange(familyID uuid.UUID, from, to string) ([]models.Event, error) {
	var events []models.Event
	err := r.db.
		Where("family_id = ? AND start_at <= ? AND end_at >= ?", familyID, to, from).
		Order("start_at ASC").
		Find(&events).Error
	return events, err
}

func (r *EventRepository) Update(e *models.Event) error {
	return r.db.Save(e).Error
}

func (r *EventRepository) Delete(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.Event{}).Error
}
