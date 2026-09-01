package models

import "github.com/google/uuid"

// Expense — satu entri pengeluaran keluarga
type Expense struct {
	BaseModel
	FamilyID    uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	CreatedBy   uuid.UUID `gorm:"type:uuid;not null"       json:"created_by"`
	Amount      float64   `gorm:"not null"                 json:"amount"`
	Currency    string    `gorm:"not null;default:'IDR'"   json:"currency"`
	Category    string    `gorm:"not null"                 json:"category"`
	Description string    `gorm:"default:''"               json:"description"`
	Date        string    `gorm:"type:date;not null"       json:"date"`
	ReceiptURL  string    `gorm:"default:''"               json:"receipt_url"`
}

// Budget — target pengeluaran per kategori per bulan
type Budget struct {
	BaseModel
	FamilyID uuid.UUID `gorm:"type:uuid;not null;index"       json:"family_id"`
	Category string    `gorm:"not null"                       json:"category"`
	Amount   float64   `gorm:"not null"                       json:"amount"`
	Period   string    `gorm:"not null;default:'monthly'"     json:"period"` // monthly | yearly
	Month    int       `gorm:"not null"                       json:"month"`
	Year     int       `gorm:"not null"                       json:"year"`
}

// ShoppingItem — item dalam daftar belanja keluarga
type ShoppingItem struct {
	BaseModel
	FamilyID  uuid.UUID  `gorm:"type:uuid;not null;index" json:"family_id"`
	AddedBy   uuid.UUID  `gorm:"type:uuid;not null"       json:"added_by"`
	Name      string     `gorm:"not null"                 json:"name"`
	Quantity  string     `gorm:"default:'1'"              json:"quantity"`
	Unit      string     `gorm:"default:''"               json:"unit"`
	Category  string     `gorm:"default:''"               json:"category"`
	IsChecked bool       `gorm:"default:false"            json:"is_checked"`
	CheckedBy *uuid.UUID `gorm:"type:uuid"                json:"checked_by"`
}
