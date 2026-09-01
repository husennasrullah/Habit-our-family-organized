package models

import "github.com/google/uuid"

// PushSubscription menyimpan data Web Push subscription dari browser user
type PushSubscription struct {
	BaseModel
	FamilyID uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	MemberID uuid.UUID `gorm:"type:uuid;not null;index" json:"member_id"`
	Endpoint string    `gorm:"not null;uniqueIndex"     json:"endpoint"`
	P256DH   string    `gorm:"not null"                 json:"p256dh"`
	Auth     string    `gorm:"not null"                 json:"auth"`
}
