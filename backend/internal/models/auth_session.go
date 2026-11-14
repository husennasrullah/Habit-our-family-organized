package models

import (
	"github.com/google/uuid"
	"time"
)

// AuthSession binds access/refresh tokens to a revocable login on one device.
// Identity data is scoped by member_id (not a family-owned content record).
type AuthSession struct {
	BaseModel
	MemberID    uuid.UUID `gorm:"type:uuid;not null;index" json:"-"`
	RefreshHash string    `gorm:"not null" json:"-"`
	ExpiresAt   time.Time `gorm:"not null;index" json:"-"`
}
