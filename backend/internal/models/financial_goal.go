package models

import (
	"github.com/google/uuid"
)

// FinancialGoal adalah target keuangan jangka panjang keluarga
type FinancialGoal struct {
	BaseModel
	FamilyID      uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	CreatedBy     uuid.UUID `gorm:"type:uuid;not null"       json:"created_by"`
	Title         string    `gorm:"not null"                 json:"title"`
	TargetAmount  float64   `gorm:"type:numeric(15,2);not null" json:"target_amount"`
	CurrentAmount float64   `gorm:"type:numeric(15,2);not null;default:0" json:"current_amount"`
	Deadline      *string   `gorm:"type:date"                json:"deadline"`
	Notes         string    `gorm:"type:text;default:''"     json:"notes"`
	IsAchieved    bool      `gorm:"default:false"            json:"is_achieved"`
}
