package models

import (
	"github.com/google/uuid"
)

// Family adalah unit keluarga utama
type Family struct {
	BaseModel
	Name       string `gorm:"not null"                  json:"name"`
	InviteCode string `gorm:"uniqueIndex;not null"      json:"invite_code"`

	Members []FamilyMember `gorm:"foreignKey:FamilyID" json:"members,omitempty"`
}

// FamilyMember adalah akun user yang merupakan anggota dari satu keluarga
type FamilyMember struct {
	BaseModel
	FamilyID     *uuid.UUID `gorm:"type:uuid;index"           json:"family_id"`
	Name         string     `gorm:"not null"                  json:"name"`
	Email        string     `gorm:"uniqueIndex;not null"      json:"email"`
	PasswordHash string     `gorm:"not null"                  json:"-"`
	Role         string     `gorm:"not null;default:'member'" json:"role"`   // admin | member | child | view_only
	AvatarURL    string     `gorm:"default:''"                json:"avatar_url"`
	Color        string     `gorm:"not null;default:'sky'"    json:"color"`
	BirthDate    *string    `                                 json:"birth_date"`
	AuthProvider string     `gorm:"not null;default:'email'"  json:"auth_provider"` // email | google | both
	GoogleID     string     `gorm:"index;default:''"          json:"-"`

	Family *Family `gorm:"foreignKey:FamilyID" json:"family,omitempty"`
}
