package services

import (
	"errors"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"

	"github.com/google/uuid"
)

// ─── DTOs ─────────────────────────────────────────────────────────────────────

type CreateMealPlanRequest struct {
	Date      string          `json:"date"`      // YYYY-MM-DD
	MealType  models.MealType `json:"meal_type"` // breakfast | lunch | dinner
	Name      string          `json:"name"`
	Notes     string          `json:"notes"`
	RecipeURL string          `json:"recipe_url"`
}

type UpdateMealPlanRequest struct {
	Date      *string          `json:"date"`
	MealType  *models.MealType `json:"meal_type"`
	Name      string           `json:"name"`
	Notes     string           `json:"notes"`
	RecipeURL string           `json:"recipe_url"`
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

	m := &models.MealPlan{
		FamilyID:  familyID,
		CreatedBy: createdBy,
		Date:      req.Date,
		MealType:  req.MealType,
		Name:      req.Name,
		Notes:     req.Notes,
		RecipeURL: req.RecipeURL,
	}
	if err := validateMeal(m); err != nil {
		return nil, err
	}
	if err := s.repo.Create(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *MealPlanService) GetByDateRange(req GetMealPlansRequest, familyID uuid.UUID) ([]models.MealPlan, error) {
	// Default: ambil minggu ini jika tidak ada from/to
	if req.From == "" {
		req.From = weekStart(mealNow())
	}
	if req.To == "" {
		req.To = weekEnd(mealNow())
	}
	if !validMealDate(req.From) || !validMealDate(req.To) || req.From > req.To {
		return nil, errors.New("rentang tanggal tidak valid")
	}
	return s.repo.GetByDateRange(familyID, req.From, req.To)
}

// GetTodayMeals dipakai scheduler notifikasi pagi hari
func (s *MealPlanService) GetTodayMeals(familyID uuid.UUID) ([]models.MealPlan, error) {
	today := mealNow().Format("2006-01-02")
	return s.repo.GetByDate(familyID, today)
}

func (s *MealPlanService) Update(id uuid.UUID, req UpdateMealPlanRequest, familyID uuid.UUID) (*models.MealPlan, error) {

	m, err := s.repo.GetByID(id, familyID)
	if err != nil {
		return nil, errors.New("jadwal makanan tidak ditemukan")
	}
	if len(m.Date) > 10 && m.Date[10] == 'T' {
		m.Date = m.Date[:10]
	}
	m.Name = req.Name
	m.Notes = req.Notes
	m.RecipeURL = req.RecipeURL
	if req.Date != nil {
		if !validMealDate(*req.Date) {
			return nil, errors.New("tanggal tidak valid")
		}
		m.Date = *req.Date
	}
	if req.MealType != nil {
		m.MealType = *req.MealType
	}
	if err := validateMeal(m); err != nil {
		return nil, err
	}
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

// Calendar dates and daily notifications consistently use WIB, including outside Docker.
func mealNow() time.Time { return time.Now().In(time.FixedZone("WIB", 7*60*60)) }
func validMealDate(value string) bool {
	parsed, err := time.Parse("2006-01-02", value)
	return err == nil && parsed.Format("2006-01-02") == value && parsed.Year() >= 1
}
func validateMeal(m *models.MealPlan) error {
	m.Name = strings.TrimSpace(m.Name)
	m.Notes = strings.TrimSpace(m.Notes)
	m.RecipeURL = strings.TrimSpace(m.RecipeURL)
	if m.Name == "" || utf8.RuneCountInString(m.Name) > 150 {
		return errors.New("nama masakan wajib diisi, maksimal 150 karakter")
	}
	if utf8.RuneCountInString(m.Notes) > 2000 {
		return errors.New("catatan maksimal 2000 karakter")
	}
	if !validMealDate(m.Date) {
		return errors.New("tanggal harus valid dengan format YYYY-MM-DD")
	}
	if !validMealTypes[m.MealType] {
		return errors.New("waktu makan tidak valid")
	}
	if m.RecipeURL != "" {
		u, err := url.Parse(m.RecipeURL)
		if err != nil || len(m.RecipeURL) > 2048 || (u.Scheme != "https" && u.Scheme != "http") || u.Hostname() == "" || u.User != nil {
			return errors.New("link resep harus berupa URL http atau https yang valid")
		}
	}
	return nil
}
