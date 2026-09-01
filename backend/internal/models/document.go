package models

import "github.com/google/uuid"

// Document — dokumen penting keluarga tersimpan di object storage
type Document struct {
	BaseModel
	FamilyID    uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	UploadedBy  uuid.UUID `gorm:"type:uuid;not null"       json:"uploaded_by"`
	Title       string    `gorm:"not null"                 json:"title"`
	Type        string    `gorm:"not null;default:'other'" json:"type"` // ktp|kk|akta|asuransi|bpjs|other
	ObjectKey   string    `gorm:"not null"                 json:"object_key"`
	FileSize    int64     `gorm:"default:0"                json:"file_size"`
	IsEncrypted bool      `gorm:"default:false"            json:"is_encrypted"`
	Tags        string    `gorm:"default:''"               json:"tags"` // comma-separated
}
