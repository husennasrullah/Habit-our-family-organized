package services

import (
	"errors"
	"fmt"
	"math"
	"strings"
	"time"
	"unicode/utf8"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"

	"github.com/google/uuid"
)

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
	VaccineName   string  `json:"vaccine_name"   validate:"required"`
	ScheduledDate string  `json:"scheduled_date" validate:"required"`
	GivenDate     *string `json:"given_date"`
	GivenBy       string  `json:"given_by"`
	Notes         string  `json:"notes"`
}

type MarkVaccineGivenRequest struct {
	GivenDate string  `json:"given_date" validate:"required"`
	GivenBy   *string `json:"given_by"`
	Notes     *string `json:"notes"`
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

type AchievementRequest struct {
	Achieved   bool    `json:"achieved"`
	AchievedAt *string `json:"achieved_at"`
}
type KidsService struct{ repo *repositories.KidsRepository }

func NewKidsService(repo *repositories.KidsRepository) *KidsService { return &KidsService{repo: repo} }

var ErrKidsValidation = errors.New("data anak tidak valid")

func kidInvalid(message string) error { return fmt.Errorf("%w: %s", ErrKidsValidation, message) }
func kidsToday() string               { return time.Now().In(time.FixedZone("WIB", 7*60*60)).Format("2006-01-02") }
func kidDate(value string) string {
	if len(value) > 10 && value[10] == 'T' {
		return value[:10]
	}
	return value
}
func kidText(value *string, label string, max int, required bool) error {
	*value = strings.TrimSpace(*value)
	if (required && *value == "") || utf8.RuneCountInString(*value) > max {
		return kidInvalid(fmt.Sprintf("%s wajib sesuai isian (maksimal %d karakter)", label, max))
	}
	return nil
}
func kidDateValid(value, birth string, future bool) error {
	if !validMealDate(value) {
		return kidInvalid("tanggal harus valid dengan format YYYY-MM-DD")
	}
	if birth != "" && value < kidDate(birth) {
		return kidInvalid("tanggal tidak boleh sebelum tanggal lahir")
	}
	if !future && value > kidsToday() {
		return kidInvalid("tanggal aktual tidak boleh di masa depan")
	}
	return nil
}
func validKid(k *models.KidProfile) error {
	if err := kidText(&k.Name, "nama anak", 150, true); err != nil {
		return err
	}
	if k.Gender != "" && k.Gender != "male" && k.Gender != "female" {
		return kidInvalid("jenis kelamin tidak valid")
	}
	if err := kidText(&k.Notes, "catatan", 2000, false); err != nil {
		return err
	}
	return kidDateValid(k.BirthDate, "", false)
}
func (s *KidsService) CreateKid(req CreateKidRequest, familyID uuid.UUID) (*models.KidProfile, error) {
	k := &models.KidProfile{FamilyID: familyID, Name: req.Name, Gender: req.Gender, BirthDate: req.BirthDate, Notes: req.Notes}
	if err := validKid(k); err != nil {
		return nil, err
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
	var result *models.KidProfile
	err := s.repo.WithKid(id, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		k.BirthDate = kidDate(k.BirthDate)
		if req.Name != nil {
			k.Name = *req.Name
		}
		if req.Gender != nil {
			k.Gender = *req.Gender
		}
		if req.BirthDate != nil {
			k.BirthDate = *req.BirthDate
		}
		if req.Notes != nil {
			k.Notes = *req.Notes
		}
		if err := validKid(k); err != nil {
			return err
		}
		before, err := repo.HasHistoryBefore(id, k.BirthDate)
		if err != nil {
			return err
		}
		if before {
			return kidInvalid("tanggal lahir melewati catatan yang sudah ada; koreksi tanggal catatan terlebih dahulu")
		}
		if err := repo.UpdateKid(k); err != nil {
			return err
		}
		result = k
		return nil
	})
	return result, err
}
func (s *KidsService) DeleteKid(id, familyID uuid.UUID) error {
	return s.repo.WithKid(id, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		return repo.DeleteKid(id, familyID)
	})
}
func validGrowth(g *models.GrowthRecord, birth string) error {
	if err := kidDateValid(g.Date, birth, false); err != nil {
		return err
	}
	count := 0
	for _, n := range []*float64{g.HeightCm, g.WeightKg, g.HeadCircumferenceCm} {
		if n != nil {
			count++
			if math.IsNaN(*n) || math.IsInf(*n, 0) || *n <= 0 || *n > 999.99 || math.Abs(*n*100-math.Round(*n*100)) > 1e-7 {
				return kidInvalid("ukuran harus positif, maksimal 999,99 dengan dua desimal")
			}
		}
	}
	if count == 0 {
		return kidInvalid("isi minimal satu ukuran pertumbuhan")
	}
	return kidText(&g.Notes, "catatan", 2000, false)
}
func validVaccine(v *models.VaccineRecord, birth string) error {
	if err := kidText(&v.VaccineName, "nama vaksin", 150, true); err != nil {
		return err
	}
	if err := kidDateValid(v.ScheduledDate, birth, true); err != nil {
		return err
	}
	if v.GivenDate != nil {
		if err := kidDateValid(*v.GivenDate, birth, false); err != nil {
			return err
		}
	}
	if err := kidText(&v.GivenBy, "pemberi vaksin", 150, false); err != nil {
		return err
	}
	if err := kidText(&v.Notes, "catatan", 2000, false); err != nil {
		return err
	}
	vaccineStatus(v)
	return nil
}
func vaccineStatus(v *models.VaccineRecord) {
	if v.GivenDate != nil {
		v.Status = models.VaccineStatusGiven
	} else if kidDate(v.ScheduledDate) < kidsToday() {
		v.Status = models.VaccineStatusOverdue
	} else {
		v.Status = models.VaccineStatusScheduled
	}
}
func validMilestone(m *models.Milestone, birth string) error {
	if err := kidText(&m.Title, "judul pencapaian", 150, true); err != nil {
		return err
	}
	if m.Category != "" && m.Category != "motorik" && m.Category != "bahasa" && m.Category != "sosial" && m.Category != "kognitif" && m.Category != "other" {
		return kidInvalid("kategori pencapaian tidak valid")
	}
	if m.AchievedAt != nil {
		if err := kidDateValid(*m.AchievedAt, birth, false); err != nil {
			return err
		}
	}
	m.IsAchieved = m.AchievedAt != nil
	return kidText(&m.Notes, "catatan", 2000, false)
}
func validHealth(h *models.HealthRecord, birth string) error {
	if h.Type != "illness" && h.Type != "checkup" && h.Type != "dental" && h.Type != "other" {
		return kidInvalid("tipe catatan kesehatan tidak valid")
	}
	if err := kidDateValid(h.Date, birth, false); err != nil {
		return err
	}
	for _, field := range []struct {
		value    *string
		label    string
		max      int
		required bool
	}{{&h.Description, "deskripsi", 2000, true}, {&h.Doctor, "dokter", 150, false}, {&h.Medication, "obat", 1000, false}, {&h.Notes, "catatan", 2000, false}} {
		if err := kidText(field.value, field.label, field.max, field.required); err != nil {
			return err
		}
	}
	return nil
}

func (s *KidsService) GetGrowth(kidID, familyID uuid.UUID) ([]models.GrowthRecord, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, err
	}
	list := make([]models.GrowthRecord, 0)
	err := s.repo.ListRecords(kidID, familyID, &list, "date ASC, id ASC")
	return list, err
}
func (s *KidsService) AddGrowth(kidID, familyID uuid.UUID, req CreateGrowthRequest) (*models.GrowthRecord, error) {
	return s.writeGrowth(uuid.Nil, kidID, familyID, req)
}
func (s *KidsService) UpdateGrowth(id, kidID, familyID uuid.UUID, req CreateGrowthRequest) (*models.GrowthRecord, error) {
	return s.writeGrowth(id, kidID, familyID, req)
}
func (s *KidsService) writeGrowth(id, kidID, familyID uuid.UUID, req CreateGrowthRequest) (*models.GrowthRecord, error) {
	record := &models.GrowthRecord{KidID: kidID, Date: req.Date, HeightCm: req.HeightCm, WeightKg: req.WeightKg, HeadCircumferenceCm: req.HeadCircumferenceCm, Notes: req.Notes}
	err := s.repo.WithKid(kidID, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		if err := validGrowth(record, k.BirthDate); err != nil {
			return err
		}
		if id == uuid.Nil {
			return repo.CreateRecord(record)
		}
		var old models.GrowthRecord
		if err := repo.GetRecord(id, kidID, &old); err != nil {
			return err
		}
		record.BaseModel = old.BaseModel
		return repo.UpdateRecord(id, kidID, record)
	})
	return record, err
}
func (s *KidsService) DeleteGrowth(id, kidID, familyID uuid.UUID) error {
	return s.repo.WithKid(kidID, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		return repo.DeleteRecord(id, kidID, &models.GrowthRecord{})
	})
}

func (s *KidsService) GetVaccines(kidID, familyID uuid.UUID) ([]models.VaccineRecord, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, err
	}
	list := make([]models.VaccineRecord, 0)
	err := s.repo.ListRecords(kidID, familyID, &list, "scheduled_date ASC, id ASC")
	for i := range list {
		vaccineStatus(&list[i])
	}
	return list, err
}
func (s *KidsService) AddVaccine(kidID, familyID uuid.UUID, req CreateVaccineRequest) (*models.VaccineRecord, error) {
	return s.writeVaccine(uuid.Nil, kidID, familyID, req)
}
func (s *KidsService) UpdateVaccine(id, kidID, familyID uuid.UUID, req CreateVaccineRequest) (*models.VaccineRecord, error) {
	return s.writeVaccine(id, kidID, familyID, req)
}
func (s *KidsService) writeVaccine(id, kidID, familyID uuid.UUID, req CreateVaccineRequest) (*models.VaccineRecord, error) {
	record := &models.VaccineRecord{KidID: kidID, VaccineName: req.VaccineName, ScheduledDate: req.ScheduledDate, GivenDate: req.GivenDate, GivenBy: req.GivenBy, Notes: req.Notes}
	err := s.repo.WithKid(kidID, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		if err := validVaccine(record, k.BirthDate); err != nil {
			return err
		}
		if id == uuid.Nil {
			return repo.CreateRecord(record)
		}
		var old models.VaccineRecord
		if err := repo.GetRecord(id, kidID, &old); err != nil {
			return err
		}
		record.BaseModel = old.BaseModel
		return repo.UpdateRecord(id, kidID, record)
	})
	return record, err
}
func (s *KidsService) DeleteVaccine(id, kidID, familyID uuid.UUID) error {
	return s.repo.WithKid(kidID, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		return repo.DeleteRecord(id, kidID, &models.VaccineRecord{})
	})
}

func (s *KidsService) GetMilestones(kidID, familyID uuid.UUID) ([]models.Milestone, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, err
	}
	list := make([]models.Milestone, 0)
	err := s.repo.ListRecords(kidID, familyID, &list, "category ASC, created_at ASC, id ASC")
	return list, err
}
func (s *KidsService) AddMilestone(kidID, familyID uuid.UUID, req CreateMilestoneRequest) (*models.Milestone, error) {
	return s.writeMilestone(uuid.Nil, kidID, familyID, req)
}
func (s *KidsService) UpdateMilestone(id, kidID, familyID uuid.UUID, req CreateMilestoneRequest) (*models.Milestone, error) {
	return s.writeMilestone(id, kidID, familyID, req)
}
func (s *KidsService) writeMilestone(id, kidID, familyID uuid.UUID, req CreateMilestoneRequest) (*models.Milestone, error) {
	record := &models.Milestone{KidID: kidID, Title: req.Title, Category: req.Category, AchievedAt: req.AchievedAt, Notes: req.Notes}
	err := s.repo.WithKid(kidID, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		if err := validMilestone(record, k.BirthDate); err != nil {
			return err
		}
		if id == uuid.Nil {
			return repo.CreateRecord(record)
		}
		var old models.Milestone
		if err := repo.GetRecord(id, kidID, &old); err != nil {
			return err
		}
		record.BaseModel = old.BaseModel
		return repo.UpdateRecord(id, kidID, record)
	})
	return record, err
}
func (s *KidsService) DeleteMilestone(id, kidID, familyID uuid.UUID) error {
	return s.repo.WithKid(kidID, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		return repo.DeleteRecord(id, kidID, &models.Milestone{})
	})
}

func (s *KidsService) GetHealth(kidID, familyID uuid.UUID) ([]models.HealthRecord, error) {
	if _, err := s.repo.GetKidByID(kidID, familyID); err != nil {
		return nil, err
	}
	list := make([]models.HealthRecord, 0)
	err := s.repo.ListRecords(kidID, familyID, &list, "date DESC, id ASC")
	return list, err
}
func (s *KidsService) AddHealth(kidID, familyID uuid.UUID, req CreateHealthRequest) (*models.HealthRecord, error) {
	return s.writeHealth(uuid.Nil, kidID, familyID, req)
}
func (s *KidsService) UpdateHealth(id, kidID, familyID uuid.UUID, req CreateHealthRequest) (*models.HealthRecord, error) {
	return s.writeHealth(id, kidID, familyID, req)
}
func (s *KidsService) writeHealth(id, kidID, familyID uuid.UUID, req CreateHealthRequest) (*models.HealthRecord, error) {
	record := &models.HealthRecord{KidID: kidID, Type: req.Type, Description: req.Description, Date: req.Date, Doctor: req.Doctor, Medication: req.Medication, Notes: req.Notes}
	err := s.repo.WithKid(kidID, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		if err := validHealth(record, k.BirthDate); err != nil {
			return err
		}
		if id == uuid.Nil {
			return repo.CreateRecord(record)
		}
		var old models.HealthRecord
		if err := repo.GetRecord(id, kidID, &old); err != nil {
			return err
		}
		record.BaseModel = old.BaseModel
		return repo.UpdateRecord(id, kidID, record)
	})
	return record, err
}
func (s *KidsService) DeleteHealth(id, kidID, familyID uuid.UUID) error {
	return s.repo.WithKid(kidID, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		return repo.DeleteRecord(id, kidID, &models.HealthRecord{})
	})
}

func (s *KidsService) MarkVaccineGiven(id, kidID, familyID uuid.UUID, req MarkVaccineGivenRequest) (*models.VaccineRecord, error) {
	var v models.VaccineRecord
	err := s.repo.WithKid(kidID, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		if err := repo.GetRecord(id, kidID, &v); err != nil {
			return err
		}
		v.ScheduledDate = kidDate(v.ScheduledDate)
		v.GivenDate = &req.GivenDate
		if req.GivenBy != nil {
			v.GivenBy = *req.GivenBy
		}
		if req.Notes != nil {
			v.Notes = *req.Notes
		}
		if err := validVaccine(&v, k.BirthDate); err != nil {
			return err
		}
		return repo.UpdateRecord(id, kidID, &v)
	})
	return &v, err
}
func (s *KidsService) SetMilestoneAchievement(id, kidID, familyID uuid.UUID, req AchievementRequest) (*models.Milestone, error) {
	return s.achievement(id, kidID, familyID, &req)
}

// Keep the legacy route serialized; new clients send their desired achieved state explicitly.
func (s *KidsService) ToggleMilestone(id, kidID, familyID uuid.UUID) (*models.Milestone, error) {
	return s.achievement(id, kidID, familyID, nil)
}
func (s *KidsService) achievement(id, kidID, familyID uuid.UUID, req *AchievementRequest) (*models.Milestone, error) {
	var m models.Milestone
	err := s.repo.WithKid(kidID, familyID, func(repo *repositories.KidsRepository, k *models.KidProfile) error {
		if err := repo.GetRecord(id, kidID, &m); err != nil {
			return err
		}
		achieved := !m.IsAchieved
		if req != nil {
			achieved = req.Achieved
		}
		if !achieved {
			m.AchievedAt = nil
		} else if req != nil && req.AchievedAt != nil {
			m.AchievedAt = req.AchievedAt
		} else if !m.IsAchieved || m.AchievedAt == nil {
			today := kidsToday()
			m.AchievedAt = &today
		} else {
			date := kidDate(*m.AchievedAt)
			m.AchievedAt = &date
		}
		if err := validMilestone(&m, k.BirthDate); err != nil {
			return err
		}
		return repo.UpdateRecord(id, kidID, &m)
	})
	return &m, err
}
