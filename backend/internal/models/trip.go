package models

import (
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
	Creator        *FamilyMember      `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	Members        []FamilyMember     `gorm:"many2many:trip_members;joinForeignKey:trip_id;joinReferences:member_id" json:"members,omitempty"`
	Itineraries    []TripItinerary    `gorm:"foreignKey:TripID;constraint:OnDelete:CASCADE" json:"itineraries,omitempty"`
	PackingItems   []TripPackingItem  `gorm:"foreignKey:TripID;constraint:OnDelete:CASCADE" json:"packing_items,omitempty"`
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
	TripID      uuid.UUID `gorm:"type:uuid;not null;index" json:"trip_id"`
	DayNumber   int       `gorm:"not null;default:1" json:"day_number"`
	Date        *string   `gorm:"type:date" json:"date"`
	TimeStart   string    `gorm:"type:varchar(10);default:''" json:"time_start"`
	TimeEnd     string    `gorm:"type:varchar(10);default:''" json:"time_end"`
	Title       string    `gorm:"not null" json:"title"`
	Location    string    `gorm:"default:''" json:"location"`
	LocationURL string    `gorm:"type:text;default:''" json:"location_url"`
	Notes       string    `gorm:"type:text;default:''" json:"notes"`
	SortOrder   int       `gorm:"default:0" json:"sort_order"`
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
