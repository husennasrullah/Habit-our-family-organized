package models

import "github.com/google/uuid"

// MealType mendefinisikan waktu makan
type MealType string

const (
	MealTypeBreakfast MealType = "breakfast"
	MealTypeLunch     MealType = "lunch"
	MealTypeDinner    MealType = "dinner"
)

// MealPlan adalah rencana masakan untuk satu slot waktu makan pada tanggal tertentu
type MealPlan struct {
	BaseModel
	FamilyID  uuid.UUID `gorm:"type:uuid;not null;index" json:"family_id"`
	CreatedBy uuid.UUID `gorm:"type:uuid;not null"       json:"created_by"`
	Date      string    `gorm:"type:date;not null;index" json:"date"`       // YYYY-MM-DD
	MealType  MealType  `gorm:"not null"                 json:"meal_type"`  // breakfast | lunch | dinner
	Name      string    `gorm:"not null"                 json:"name"`       // nama masakan
	Notes     string    `gorm:"default:''"               json:"notes"`      // catatan singkat
	RecipeURL string    `gorm:"default:''"               json:"recipe_url"` // link resep (opsional)
}
