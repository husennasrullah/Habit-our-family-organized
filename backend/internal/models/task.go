package models

import (
	"github.com/google/uuid"
)

// TaskStatus mendefinisikan status sebuah task
type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "pending"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusDone       TaskStatus = "done"
)

// Task adalah tugas/chore yang bisa di-assign ke anggota keluarga
type Task struct {
	BaseModel
	FamilyID       uuid.UUID  `gorm:"type:uuid;not null;index"    json:"family_id"`
	CreatedBy      uuid.UUID  `gorm:"type:uuid;not null"          json:"created_by"`
	AssignedTo     *uuid.UUID `gorm:"type:uuid"                   json:"assigned_to"`
	Title          string     `gorm:"not null"                    json:"title"`
	Description    string     `gorm:"default:''"                  json:"description"`
	Points         int        `gorm:"default:0"                   json:"points"`
	Status         TaskStatus `gorm:"not null;default:'pending'"  json:"status"`
	DueDate        *string    `gorm:"type:date"                   json:"due_date"`
	IsRecurring    bool       `gorm:"default:false"               json:"is_recurring"`
	RecurrenceRule string     `gorm:"default:''"                  json:"recurrence_rule"`
}
