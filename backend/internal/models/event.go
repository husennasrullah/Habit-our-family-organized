package models

import (
	"github.com/google/uuid"
)

// EventType mendefinisikan tipe event kalender
type EventType string

const (
	EventTypeGeneral  EventType = "general"
	EventTypeSchool   EventType = "school"
	EventTypeMedical  EventType = "medical"
	EventTypeBirthday EventType = "birthday"
	EventTypeVacation EventType = "vacation"
)

// Event adalah entri kalender keluarga
type Event struct {
	BaseModel
	FamilyID        uuid.UUID  `gorm:"type:uuid;not null;index"   json:"family_id"`
	CreatedBy       uuid.UUID  `gorm:"type:uuid;not null"         json:"created_by"`
	Title           string     `gorm:"not null"                   json:"title"`
	Description     string     `gorm:"default:''"                 json:"description"`
	StartAt         string     `gorm:"not null"                   json:"start_at"`
	EndAt           string     `gorm:"not null"                   json:"end_at"`
	IsAllDay        bool       `gorm:"default:false"              json:"is_all_day"`
	Type            EventType  `gorm:"not null;default:'general'" json:"type"`
	Color           string     `gorm:"not null;default:'sky'"     json:"color"`
	IsRecurring     bool       `gorm:"default:false"              json:"is_recurring"`
	RecurrenceRule  string     `gorm:"default:''"                 json:"recurrence_rule"`
	ReminderMinutes int        `gorm:"default:0"                  json:"reminder_minutes"`
}
