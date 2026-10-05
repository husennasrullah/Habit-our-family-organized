package models

import (
	"time"

	"github.com/google/uuid"
)

type TripStatus string

const (
	TripStatusPlanning  TripStatus = "planning"
	TripStatusOngoing   TripStatus = "ongoing"
	TripStatusCompleted TripStatus = "completed"
	TripStatusCancelled TripStatus = "cancelled"
)

type Trip struct {
	BaseModel
	FamilyID       uuid.UUID          `gorm:"type:uuid;not null;index" json:"family_id"`
	CreatedBy      uuid.UUID          `gorm:"type:uuid;not null" json:"created_by"`
	Title          string             `gorm:"not null" json:"title"`
	Destination    string             `gorm:"not null" json:"destination"`
	StartDate      string             `gorm:"type:date;not null" json:"start_date"`
	EndDate        string             `gorm:"type:date;not null" json:"end_date"`
	CoverImageURL  string             `gorm:"type:text;default:''" json:"cover_image_url"`
	BudgetEstimate float64            `gorm:"type:numeric(15,2);default:0" json:"budget_estimate"`
	Status         TripStatus         `gorm:"type:varchar(50);default:'planning'" json:"status"`
	Notes          string             `gorm:"type:text;default:''" json:"notes"`
	EventID        *uuid.UUID         `gorm:"type:uuid" json:"event_id,omitempty"`
	Creator        *FamilyMember      `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	Members        []FamilyMember     `gorm:"many2many:trip_members;joinForeignKey:trip_id;joinReferences:member_id" json:"members,omitempty"`
	Itineraries    []TripItinerary    `gorm:"foreignKey:TripID;constraint:OnDelete:CASCADE" json:"itineraries,omitempty"`
	PackingItems   []TripPackingItem  `gorm:"foreignKey:TripID;constraint:OnDelete:CASCADE" json:"packing_items,omitempty"`
	Expenses       []TripExpense      `gorm:"foreignKey:TripID;constraint:OnDelete:CASCADE" json:"expenses,omitempty"`
	Documents      []TripDocument     `gorm:"foreignKey:TripID;constraint:OnDelete:CASCADE" json:"documents,omitempty"`
}

type TripMember struct {
	TripID   uuid.UUID `gorm:"type:uuid;primaryKey" json:"trip_id"`
	MemberID uuid.UUID `gorm:"type:uuid;primaryKey" json:"member_id"`
}

func (TripMember) TableName() string {
	return "trip_members"
}

type TripItinerary struct {
	BaseModel
	TripID         uuid.UUID              `gorm:"type:uuid;not null;index" json:"trip_id"`
	DayNumber      int                    `gorm:"not null;default:1" json:"day_number"`
	Date           *string                `gorm:"type:date" json:"date"`
	TimeStart      string                 `gorm:"type:varchar(10);default:''" json:"time_start"`
	TimeEnd        string                 `gorm:"type:varchar(10);default:''" json:"time_end"`
	Title          string                 `gorm:"not null" json:"title"`
	Location       string                 `gorm:"default:''" json:"location"`
	LocationURL    string                 `gorm:"type:text;default:''" json:"location_url"`
	Notes          string                 `gorm:"type:text;default:''" json:"notes"`
	SortOrder      int                    `gorm:"default:0" json:"sort_order"`
	BudgetItems    []TripItineraryBudget  `gorm:"foreignKey:ItineraryID;constraint:OnDelete:CASCADE" json:"budget_items,omitempty"`
}

type TripItineraryBudget struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ItineraryID uuid.UUID `gorm:"type:uuid;not null;index" json:"itinerary_id"`
	Label       string    `gorm:"type:varchar(255);not null" json:"label"`
	Amount      float64   `gorm:"type:numeric(15,2);not null;default:0" json:"amount"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (TripItineraryBudget) TableName() string {
	return "trip_itinerary_budgets"
}

type TripPackingItem struct {
	BaseModel
	TripID     uuid.UUID     `gorm:"type:uuid;not null;index" json:"trip_id"`
	ItemName   string        `gorm:"not null" json:"item_name"`
	Category   string        `gorm:"type:varchar(100);default:'General'" json:"category"`
	AssignedTo *uuid.UUID    `gorm:"type:uuid" json:"assigned_to"`
	IsPacked   bool          `gorm:"default:false" json:"is_packed"`
	PackedBy   *uuid.UUID    `gorm:"type:uuid" json:"packed_by"`
	Assignee   *FamilyMember `gorm:"foreignKey:AssignedTo" json:"assignee,omitempty"`
	Packer     *FamilyMember `gorm:"foreignKey:PackedBy" json:"packer,omitempty"`
}

type TripExpense struct {
	BaseModel
	TripID     uuid.UUID          `gorm:"type:uuid;not null;index" json:"trip_id"`
	FamilyID   uuid.UUID          `gorm:"type:uuid;not null;index" json:"family_id"`
	Title      string             `gorm:"type:varchar(255);not null" json:"title"`
	Amount     float64            `gorm:"type:numeric(15,2);not null;default:0" json:"amount"`
	Category   string             `gorm:"type:varchar(100);not null;default:'Lain-lain'" json:"category"`
	Date       string             `gorm:"type:date;not null" json:"date"`
	PaidBy     *uuid.UUID         `gorm:"type:uuid" json:"paid_by"`
	Notes      string             `gorm:"type:text;default:''" json:"notes"`
	SplitType  string             `gorm:"type:varchar(50);default:'all'" json:"split_type"` // 'all', 'custom'
	Payer      *FamilyMember      `gorm:"foreignKey:PaidBy" json:"payer,omitempty"`
	Splits     []TripExpenseSplit `gorm:"foreignKey:ExpenseID;constraint:OnDelete:CASCADE" json:"splits,omitempty"`
}

type TripExpenseSplit struct {
	ID        uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ExpenseID uuid.UUID     `gorm:"type:uuid;not null;index" json:"expense_id"`
	MemberID  uuid.UUID     `gorm:"type:uuid;not null;index" json:"member_id"`
	Amount    float64       `gorm:"type:numeric(15,2);not null;default:0" json:"amount"`
	IsSettled bool          `gorm:"default:false" json:"is_settled"`
	Member    *FamilyMember `gorm:"foreignKey:MemberID" json:"member,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

func (TripExpenseSplit) TableName() string {
	return "trip_expense_splits"
}

type TripDocument struct {
	BaseModel
	TripID     uuid.UUID     `gorm:"type:uuid;not null;index" json:"trip_id"`
	FamilyID   uuid.UUID     `gorm:"type:uuid;not null;index" json:"family_id"`
	UploadedBy uuid.UUID     `gorm:"type:uuid;not null" json:"uploaded_by"`
	Title      string        `gorm:"type:varchar(255);not null" json:"title"`
	DocType    string        `gorm:"type:varchar(50);default:'other'" json:"doc_type"` // 'ticket', 'hotel', 'insurance', 'visa', 'other'
	FilePath   string        `gorm:"type:text;not null" json:"file_path"`
	FileName   string        `gorm:"type:varchar(255);not null" json:"file_name"`
	FileSize   int64         `gorm:"default:0" json:"file_size"`
	FileType   string        `gorm:"type:varchar(100);default:''" json:"file_type"`
	Notes      string        `gorm:"type:text;default:''" json:"notes"`
	Uploader   *FamilyMember `gorm:"foreignKey:UploadedBy" json:"uploader,omitempty"`
}
