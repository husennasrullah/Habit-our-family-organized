package services

import (
	"errors"
	"time"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"

	"github.com/google/uuid"
)

// ─── DTOs ────────────────────────────────────────────────────────────────────

type CreateKidRequest struct {
	Name      string `json:"name"       validate:"required"`
	Gender    string `json:"gender"`
	BirthDate string `json:"birth_date" validate:"required"`
	Notes     string `json:"notes"`
}

type UpdateKidRequest struct {
	Name      *string `json:"name"`
	Gender    *string `json:"gender"`
	BirthDate *string `json:"birth_date"`
	Notes     *string `json:"notes"`
}

type CreateGrowthRequest struct {
	Date                string   `json:"date"                   validate:"required"`
	HeightCm            *float64 `json:"height_cm"`
	WeightKg            *float64 `json:"weight_kg"`
	HeadCircumferenceCm *float64 `json:"head_circumference_cm"`
	Notes               string   `json:"notes"`
}

type CreateVaccineRequest struct {
	VaccineName   string `json:"vaccine_name"   validate:"required"`
	ScheduledDate string `json:"scheduled_date" validate:"required"`
	GivenDate     *string `json:"given_date"`
	GivenBy       string `json:"given_by"`
	Notes         string `json:"notes"`
}

type MarkVaccineGivenRequest struct {
	GivenDate string `json:"given_date" validate:"required"`
	GivenBy   string `json:"given_by"`
	Notes     string `json:"notes"`
}

type CreateMilestoneRequest struct {
	Title      string  `json:"title"    validate:"required"`
	Category   string  `json:"category"`
	AchievedAt *string `json:"achieved_at"`
	Notes      string  `json:"notes"`
}

type CreateHealthRequest struct {
	Type        string `json:"type"        validate:"required"`
	Description string `json:"description" validate:"required"`
	Date        string `json:"date"        validate:"required"`
	Doctor      string `json:"doctor"`
	Medication  string `json:"medication"`
	Notes       string `json:"notes"`
}

// ─── Service ─────────────────────────────────────────────────────────────────

type KidsService struct {
	repo *repositories.KidsRepository
}

func NewKidsService(repo *repositories.KidsRepository) *KidsService {
	return &KidsService{repo: repo}
}

// ─── KidProfile ───────────────────────────────────────────────────────────────

func (s *KidsService) CreateKid(req CreateKidRequest, familyID uuid.UUID) (*models.KidProfile, error) {
	if req.Name == "" || req.BirthDate == "" {
		return nil, errors.New("nama dan tanggal lahir wajib diisi")
	}
	k := &models.KidProfile{
		FamilyID:  familyID,
		Name:      req.Name,
		Gender:    req.Gender,
		BirthDate: req.BirthDate,
		Notes:     req.Notes,
	}
	if err := s.repo.CreateKid(k); err != nil {
		return nil, err
	}
	return k, nil
}

func (s *KidsService) GetKids(familyID uuid.UUID) ([]models.KidProfile, error) {
	return s.repo.GetKidsByFamily(familyID)
}

func (s *KidsService) UpdateKid(id, familyID uuid.UUID, req UpdateKidRequest) (*models.KidProfile, error) {
	k, err := s.repo.GetKidByID(id, familyID)
	if err != nil {
		return nil, errors.New("profil anak tidak ditemukan")
	}
	if req.Name != nil      { k.Name      = *req.Name }
	if req.Gender != nil    { k.Gender    = *req.Gender }
	if req.BirthDate != nil { k.BirthDate = *req.BirthDate }
	if req.Notes != nil     { k.Notes     = *req.Notes }
	if err := s.repo.UpdateKid(k); err != nil {
		return nil, err
	}
	return k, nil
}

func (s *KidsService) DeleteKid(id, familyID uuid.UUID) error {
	if _, err := s.repo.GetKidByID(id, familyID); err != nil {
		return errors.New("profil anak tidak ditemukan")
	}
	return s.repo.DeleteKid(id, familyID)
}

// ─── Growth ───────────────────────────────────────────────────────────────────

func (s *KidsService) AddGrowth(kidID, familyID uuid.UUID, req CreateGrowthRequest) (*models.GrowthRecord, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, errors.New("profil anak tidak ditemukan")
	}
	if req.Date == "" {
		req.Date = time.Now().Format("2006-01-02")
	}
	g := &models.GrowthRecord{
		KidID:               kidID,
		Date:                req.Date,
		HeightCm:            req.HeightCm,
		WeightKg:            req.WeightKg,
		HeadCircumferenceCm: req.HeadCircumferenceCm,
		Notes:               req.Notes,
	}
	if err := s.repo.AddGrowth(g); err != nil {
		return nil, err
	}
	return g, nil
}

func (s *KidsService) GetGrowth(kidID, familyID uuid.UUID) ([]models.GrowthRecord, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, errors.New("profil anak tidak ditemukan")
	}
	return s.repo.GetGrowthByKid(kidID)
}

// ─── Vaccine ──────────────────────────────────────────────────────────────────

func (s *KidsService) AddVaccine(kidID, familyID uuid.UUID, req CreateVaccineRequest) (*models.VaccineRecord, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, errors.New("profil anak tidak ditemukan")
	}
	status := models.VaccineStatusScheduled
	if req.GivenDate != nil {
		status = models.VaccineStatusGiven
	}
	v := &models.VaccineRecord{
		KidID:         kidID,
		VaccineName:   req.VaccineName,
		ScheduledDate: req.ScheduledDate,
		GivenDate:     req.GivenDate,
		GivenBy:       req.GivenBy,
		Notes:         req.Notes,
		Status:        status,
	}
	if err := s.repo.AddVaccine(v); err != nil {
		return nil, err
	}
	return v, nil
}

func (s *KidsService) GetVaccines(kidID, familyID uuid.UUID) ([]models.VaccineRecord, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, errors.New("profil anak tidak ditemukan")
	}
	vaccines, err := s.repo.GetVaccinesByKid(kidID)
	if err != nil {
		return nil, err
	}
	// Auto-update overdue status
	today := time.Now().Format("2006-01-02")
	for i := range vaccines {
		if vaccines[i].Status == models.VaccineStatusScheduled && vaccines[i].ScheduledDate < today {
			vaccines[i].Status = models.VaccineStatusOverdue
			_ = s.repo.UpdateVaccine(&vaccines[i])
		}
	}
	return vaccines, nil
}

func (s *KidsService) MarkVaccineGiven(vaccineID, familyID uuid.UUID, req MarkVaccineGivenRequest) (*models.VaccineRecord, error) {
	v, err := s.repo.GetVaccineByID(vaccineID)
	if err != nil {
		return nil, errors.New("vaksin tidak ditemukan")
	}
	// Validasi kid milik family ini
	if _, err := s.repo.GetKidByID(v.KidID, familyID); err != nil {
		return nil, errors.New("akses ditolak")
	}
	v.Status    = models.VaccineStatusGiven
	v.GivenDate = &req.GivenDate
	v.GivenBy   = req.GivenBy
	v.Notes     = req.Notes
	if err := s.repo.UpdateVaccine(v); err != nil {
		return nil, err
	}
	return v, nil
}

// ─── Milestone ────────────────────────────────────────────────────────────────

func (s *KidsService) AddMilestone(kidID, familyID uuid.UUID, req CreateMilestoneRequest) (*models.Milestone, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, errors.New("profil anak tidak ditemukan")
	}
	isAchieved := req.AchievedAt != nil
	m := &models.Milestone{
		KidID:      kidID,
		Title:      req.Title,
		Category:   req.Category,
		AchievedAt: req.AchievedAt,
		Notes:      req.Notes,
		IsAchieved: isAchieved,
	}
	if err := s.repo.AddMilestone(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *KidsService) GetMilestones(kidID, familyID uuid.UUID) ([]models.Milestone, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, errors.New("profil anak tidak ditemukan")
	}
	return s.repo.GetMilestonesByKid(kidID)
}

func (s *KidsService) ToggleMilestone(milestoneID, familyID uuid.UUID) (*models.Milestone, error) {
	m, err := s.repo.GetMilestoneByID(milestoneID)
	if err != nil {
		return nil, errors.New("milestone tidak ditemukan")
	}
	if _, err := s.repo.GetKidByID(m.KidID, familyID); err != nil {
		return nil, errors.New("akses ditolak")
	}
	m.IsAchieved = !m.IsAchieved
	if m.IsAchieved {
		today := time.Now().Format("2006-01-02")
		m.AchievedAt = &today
	} else {
		m.AchievedAt = nil
	}
	if err := s.repo.UpdateMilestone(m); err != nil {
		return nil, err
	}
	return m, nil
}

// ─── Health ───────────────────────────────────────────────────────────────────

func (s *KidsService) AddHealth(kidID, familyID uuid.UUID, req CreateHealthRequest) (*models.HealthRecord, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, errors.New("profil anak tidak ditemukan")
	}
	if req.Date == "" {
		req.Date = time.Now().Format("2006-01-02")
	}
	h := &models.HealthRecord{
		KidID:       kidID,
		Type:        req.Type,
		Description: req.Description,
		Date:        req.Date,
		Doctor:      req.Doctor,
		Medication:  req.Medication,
		Notes:       req.Notes,
	}
	if err := s.repo.AddHealth(h); err != nil {
		return nil, err
	}
	return h, nil
}

func (s *KidsService) GetHealth(kidID, familyID uuid.UUID) ([]models.HealthRecord, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, errors.New("profil anak tidak ditemukan")
	}
	return s.repo.GetHealthByKid(kidID)
}
