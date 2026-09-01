package models

import "github.com/google/uuid"

// Memory adalah entri jurnal/kenangan keluarga
type Memory struct {
	BaseModel
	FamilyID  uuid.UUID     `gorm:"type:uuid;not null;index" json:"family_id"`
	CreatedBy uuid.UUID     `gorm:"type:uuid;not null"       json:"created_by"`
	Title     string        `gorm:"not null"                 json:"title"`
	Content   string        `gorm:"type:text;default:''"     json:"content"`
	Date      string        `gorm:"type:date;not null"       json:"date"`
	IsFavorite bool         `gorm:"default:false"            json:"is_favorite"`
	Photos    []MemoryPhoto `gorm:"foreignKey:MemoryID"      json:"photos,omitempty"`
}

// MemoryPhoto adalah satu foto yang terlampir ke sebuah Memory.
// URL menyimpan object key (bukan full URL) — di-resolve saat serving.
type MemoryPhoto struct {
	BaseModel
	MemoryID uuid.UUID `gorm:"type:uuid;not null;index" json:"memory_id"`
	ObjectKey string   `gorm:"not null"                 json:"object_key"` // key di storage
	Caption  string    `gorm:"default:''"               json:"caption"`
	Order    int       `gorm:"default:0"                json:"order"`
}
