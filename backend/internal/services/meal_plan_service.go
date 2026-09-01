package services

import (
	"errors"
	"time"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"

	"github.com/google/uuid"
)

// ─── DTOs ─────────────────────────────────────────────────────────────────────

type CreateMealPlanRequest struct {
	Date      string           `json:"date"`       // YYYY-MM-DD
	MealType  models.MealType  `json:"meal_type"`  // breakfast | lunch | dinner
	Name      string           `json:"name"`
	Notes     string           `json:"notes"`
	RecipeURL string           `json:"recipe_url"`
}

type UpdateMealPlanRequest struct {
	Name      string `json:"name"`
	Notes     string `json:"notes"`
	RecipeURL string `json:"recipe_url"`
}

type GetMealPlansRequest struct {
	From string `json:"from"` // YYYY-MM-DD
	To   string `json:"to"`   // YYYY-MM-DD
}

// ─── Service ──────────────────────────────────────────────────────────────────

type MealPlanService struct {
	repo *repositories.MealPlanRepository
}

func NewMealPlanService(repo *repositories.MealPlanRepository) *MealPlanService {
	return &MealPlanService{repo: repo}
}

var validMealTypes = map[models.MealType]bool{
	models.MealTypeBreakfast: true,
	models.MealTypeLunch:     true,
	models.MealTypeDinner:    true,
}

func (s *MealPlanService) Create(req CreateMealPlanRequest, familyID, createdBy uuid.UUID) (*models.MealPlan, error) {
	if req.Name == "" {
		return nil, errors.New("nama masakan wajib diisi")
	}
	if req.Date == "" {
		return nil, errors.New("tanggal wajib diisi")
	}
	if !validMealTypes[req.MealType] {
		return nil, errors.New("meal_type harus salah satu dari: breakfast, lunch, dinner")
	}

	m := &models.MealPlan{
		FamilyID:  familyID,
		CreatedBy: createdBy,
		Date:      req.Date,
		MealType:  req.MealType,
		Name:      req.Name,
		Notes:     req.Notes,
		RecipeURL: req.RecipeURL,
	}
	if err := s.repo.Create(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *MealPlanService) GetByDateRange(req GetMealPlansRequest, familyID uuid.UUID) ([]models.MealPlan, error) {
	// Default: ambil minggu ini jika tidak ada from/to
	if req.From == "" {
		req.From = weekStart(time.Now())
	}
	if req.To == "" {
		req.To = weekEnd(time.Now())
	}
	return s.repo.GetByDateRange(familyID, req.From, req.To)
}

// GetTodayMeals dipakai scheduler notifikasi pagi hari
func (s *MealPlanService) GetTodayMeals(familyID uuid.UUID) ([]models.MealPlan, error) {
	today := time.Now().Format("2006-01-02")
	return s.repo.GetByDate(familyID, today)
}

func (s *MealPlanService) Update(id uuid.UUID, req UpdateMealPlanRequest, familyID uuid.UUID) (*models.MealPlan, error) {
	if req.Name == "" {
		return nil, errors.New("nama masakan wajib diisi")
	}
	m, err := s.repo.GetByID(id, familyID)
	if err != nil {
		return nil, errors.New("jadwal makanan tidak ditemukan")
	}
	m.Name      = req.Name
	m.Notes     = req.Notes
	m.RecipeURL = req.RecipeURL
	if err := s.repo.Update(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *MealPlanService) Delete(id, familyID uuid.UUID) error {
	return s.repo.Delete(id, familyID)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// weekStart mengembalikan hari Senin minggu ini (format YYYY-MM-DD)
func weekStart(t time.Time) string {
	weekday := int(t.Weekday())
	if weekday == 0 {
		weekday = 7 // Sunday → 7
	}
	monday := t.AddDate(0, 0, -(weekday - 1))
	return monday.Format("2006-01-02")
}

// weekEnd mengembalikan hari Minggu minggu ini (format YYYY-MM-DD)
func weekEnd(t time.Time) string {
	weekday := int(t.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	sunday := t.AddDate(0, 0, 7-weekday)
	return sunday.Format("2006-01-02")
}
