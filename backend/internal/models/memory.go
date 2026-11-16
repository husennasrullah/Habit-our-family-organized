package models

import "github.com/google/uuid"

// Memory adalah entri jurnal/kenangan keluarga
type Memory struct {
	BaseModel
	FamilyID             uuid.UUID     `gorm:"type:uuid;not null;index" json:"family_id"`
	CreatedBy            uuid.UUID     `gorm:"type:uuid;not null"       json:"created_by"`
	Title                string        `gorm:"not null"                 json:"title"`
	Content              string        `gorm:"type:text;default:''"     json:"content"`
	Date                 string        `gorm:"type:date;not null"       json:"date"`
	StorageDeletePending bool          `gorm:"default:false" json:"storage_delete_pending"`
	IsFavorite           bool          `gorm:"default:false"            json:"is_favorite"`
	Photos               []MemoryPhoto `gorm:"foreignKey:MemoryID"      json:"photos,omitempty"`
}

// MemoryPhoto adalah satu foto yang terlampir ke sebuah Memory.
// URL menyimpan object key (bukan full URL) — di-resolve saat serving.
type MemoryPhoto struct {
	BaseModel
	UploadPending        bool      `gorm:"default:false" json:"upload_pending"`
	MemoryID             uuid.UUID `gorm:"type:uuid;not null;index" json:"memory_id"`
	StorageDeletePending bool      `gorm:"default:false" json:"storage_delete_pending"`
	ObjectKey            string    `gorm:"not null"                 json:"-"` // key di storage
	Caption              string    `gorm:"default:''"               json:"caption"`
	Order                int       `gorm:"default:0"                json:"order"`
}
