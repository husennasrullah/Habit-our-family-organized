package models

import "github.com/google/uuid"

// KidProfile — profil anak dalam keluarga
type KidProfile struct {
	BaseModel
	FamilyID uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	MemberID *uuid.UUID `gorm:"type:uuid"               json:"member_id"` // nullable — anak kecil belum punya akun
	Name     string    `gorm:"not null"                 json:"name"`
	Gender   string    `gorm:"not null;default:''"      json:"gender"`   // male | female
	BirthDate string   `gorm:"type:date;not null"       json:"birth_date"`
	AvatarURL string   `gorm:"default:''"               json:"avatar_url"`
	Notes    string    `gorm:"type:text;default:''"     json:"notes"`
}

// GrowthRecord — catatan tinggi, berat, lingkar kepala
type GrowthRecord struct {
	BaseModel
	KidID              uuid.UUID `gorm:"type:uuid;not null;index" json:"kid_id"`
	Date               string    `gorm:"type:date;not null"       json:"date"`
	HeightCm           *float64  `gorm:"type:numeric(5,2)"        json:"height_cm"`
	WeightKg           *float64  `gorm:"type:numeric(5,2)"        json:"weight_kg"`
	HeadCircumferenceCm *float64 `gorm:"type:numeric(5,2)"        json:"head_circumference_cm"`
	Notes              string    `gorm:"default:''"               json:"notes"`
}

// VaccineStatus enum
type VaccineStatus string

const (
	VaccineStatusScheduled VaccineStatus = "scheduled"
	VaccineStatusGiven     VaccineStatus = "given"
	VaccineStatusOverdue   VaccineStatus = "overdue"
)

// VaccineRecord — jadwal dan riwayat vaksin
type VaccineRecord struct {
	BaseModel
	KidID         uuid.UUID     `gorm:"type:uuid;not null;index"         json:"kid_id"`
	VaccineName   string        `gorm:"not null"                         json:"vaccine_name"`
	ScheduledDate string        `gorm:"type:date;not null"               json:"scheduled_date"`
	GivenDate     *string       `gorm:"type:date"                        json:"given_date"`
	GivenBy       string        `gorm:"default:''"                       json:"given_by"`
	Notes         string        `gorm:"default:''"                       json:"notes"`
	Status        VaccineStatus `gorm:"not null;default:'scheduled'"     json:"status"`
}

// Milestone — pencapaian perkembangan anak
type Milestone struct {
	BaseModel
	KidID      uuid.UUID `gorm:"type:uuid;not null;index" json:"kid_id"`
	Title      string    `gorm:"not null"                 json:"title"`
	Category   string    `gorm:"default:''"               json:"category"`  // motorik | bahasa | sosial | kognitif
	AchievedAt *string   `gorm:"type:date"                json:"achieved_at"`
	Notes      string    `gorm:"default:''"               json:"notes"`
	IsAchieved bool      `gorm:"default:false"            json:"is_achieved"`
}

// HealthRecord — riwayat sakit / kunjungan dokter
type HealthRecord struct {
	BaseModel
	KidID       uuid.UUID `gorm:"type:uuid;not null;index" json:"kid_id"`
	Type        string    `gorm:"not null"                 json:"type"`       // illness | checkup | dental | other
	Description string    `gorm:"not null"                 json:"description"`
	Date        string    `gorm:"type:date;not null"       json:"date"`
	Doctor      string    `gorm:"default:''"               json:"doctor"`
	Medication  string    `gorm:"default:''"               json:"medication"`
	Notes       string    `gorm:"type:text;default:''"     json:"notes"`
}
