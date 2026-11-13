package models

import "github.com/google/uuid"

// FinancialGoalEntry records deposits and balance corrections, never fabricated historical deposits.
type FinancialGoalEntry struct {
	BaseModel
	FamilyID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"family_id"`
	GoalID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"goal_id"`
	ActorID      *uuid.UUID `gorm:"type:uuid" json:"actor_id"`
	Amount       float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	BalanceAfter float64    `gorm:"type:numeric(15,2);not null" json:"balance_after"`
	Kind         string     `gorm:"not null" json:"kind"`
	Note         string     `gorm:"not null;default:''" json:"note"`
	ActorName    string     `gorm:"->;-:migration" json:"actor_name"`
}
