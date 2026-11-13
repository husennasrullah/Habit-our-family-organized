package services

import (
	"errors"
	"math"
	"sync"
	"testing"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func TestKidsValidation(t *testing.T) {
	for _, k := range []models.KidProfile{{Name: " ", BirthDate: "2020-01-01"}, {Name: "Kid", Gender: "bad", BirthDate: "2020-01-01"}, {Name: "Kid", BirthDate: "2026-02-30"}, {Name: "Kid", BirthDate: "2999-01-01"}} {
		if validKid(&k) == nil {
			t.Fatalf("accepted profile %+v", k)
		}
	}
	name := models.KidProfile{Name: "  Ani ", Gender: "female", BirthDate: "2020-01-01", Notes: " catatan "}
	if err := validKid(&name); err != nil || name.Name != "Ani" || name.Notes != "catatan" {
		t.Fatal(name, err)
	}
	if validGrowth(&models.GrowthRecord{Date: "2026-01-01"}, "2020-01-01") == nil {
		t.Fatal("empty growth accepted")
	}
	for _, n := range []float64{0, -1, math.NaN(), math.Inf(1), 1000, 10.123} {
		if validGrowth(&models.GrowthRecord{Date: "2026-01-01", WeightKg: &n}, "2020-01-01") == nil {
			t.Fatal("invalid measurement", n)
		}
	}
	weight := 10.25
	if err := validGrowth(&models.GrowthRecord{Date: "2026-01-01", WeightKg: &weight}, "2020-01-01"); err != nil {
		t.Fatal(err)
	}
	if kidDateValid("2019-12-31", "2020-01-01", false) == nil || kidDateValid("2999-01-01", "2020-01-01", false) == nil {
		t.Fatal("invalid chronology accepted")
	}
	if err := validVaccine(&models.VaccineRecord{VaccineName: "Vaksin", ScheduledDate: "2999-01-01"}, "2020-01-01"); err != nil {
		t.Fatal("future schedule rejected", err)
	}
	if validVaccine(&models.VaccineRecord{VaccineName: " ", ScheduledDate: "2026-01-01"}, "2020-01-01") == nil {
		t.Fatal("empty vaccine accepted")
	}
	if validMilestone(&models.Milestone{Title: " ", Category: "motorik"}, "2020-01-01") == nil || validMilestone(&models.Milestone{Title: "A", Category: "bad"}, "2020-01-01") == nil {
		t.Fatal("invalid milestone accepted")
	}
	if validHealth(&models.HealthRecord{Type: "bad", Description: "A", Date: "2026-01-01"}, "2020-01-01") == nil || validHealth(&models.HealthRecord{Type: "checkup", Description: " ", Date: "2026-01-01"}, "2020-01-01") == nil {
		t.Fatal("invalid health accepted")
	}
}
func TestKidsCRUDIsolationAndConcurrentActions(t *testing.T) {
	db := financeDB(t)
	if err := db.AutoMigrate(&models.KidProfile{}, &models.GrowthRecord{}, &models.VaccineRecord{}, &models.Milestone{}, &models.HealthRecord{}); err != nil {
		t.Fatal(err)
	}
	svc := NewKidsService(repositories.NewKidsRepository(db))
	family, other := uuid.New(), uuid.New()
	kid, err := svc.CreateKid(CreateKidRequest{Name: "  Ani ", Gender: "female", BirthDate: "2020-01-01"}, family)
	if err != nil {
		t.Fatal(err)
	}
	sibling, err := svc.CreateKid(CreateKidRequest{Name: "Budi", BirthDate: "2021-01-01"}, family)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = svc.GetGrowth(kid.ID, other); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatal("foreign read", err)
	}
	note := "Catatan"
	if _, err = svc.UpdateKid(kid.ID, other, UpdateKidRequest{Notes: &note}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatal("foreign update", err)
	}
	val := 12.35
	growth, err := svc.AddGrowth(kid.ID, family, CreateGrowthRequest{Date: "2026-01-01", WeightKg: &val, Notes: "note"})
	if err != nil {
		t.Fatal(err)
	}
	head := 48.2
	growth, err = svc.UpdateGrowth(growth.ID, kid.ID, family, CreateGrowthRequest{Date: "2026-01-02", HeadCircumferenceCm: &head})
	if err != nil || growth.WeightKg != nil || growth.Notes != "" {
		t.Fatal("clear growth", growth, err)
	}
	if err = svc.DeleteGrowth(growth.ID, sibling.ID, family); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatal("sibling growth delete", err)
	}
	if _, err = svc.UpdateGrowth(growth.ID, kid.ID, other, CreateGrowthRequest{Date: "2026-01-02", WeightKg: &val}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatal("foreign growth update", err)
	}
	invalidBirth := "2026-01-03"
	if _, err = svc.UpdateKid(kid.ID, family, UpdateKidRequest{BirthDate: &invalidBirth}); !errors.Is(err, ErrKidsValidation) {
		t.Fatal("birth moved past history", err)
	}
	vaccine, err := svc.AddVaccine(kid.ID, family, CreateVaccineRequest{VaccineName: "Vaksin", ScheduledDate: "2026-01-01", GivenBy: "Klinik", Notes: "Simpan catatan"})
	if err != nil {
		t.Fatal(err)
	}
	var rawBefore models.VaccineRecord
	db.First(&rawBefore, "id = ?", vaccine.ID)
	list, err := svc.GetVaccines(kid.ID, family)
	if err != nil || list[0].Status != models.VaccineStatusOverdue {
		t.Fatal(list, err)
	}
	var rawAfter models.VaccineRecord
	db.First(&rawAfter, "id = ?", vaccine.ID)
	if !rawBefore.UpdatedAt.Equal(rawAfter.UpdatedAt) || rawBefore.Status != rawAfter.Status {
		t.Fatal("GET wrote vaccine record")
	}
	if _, err = svc.MarkVaccineGiven(vaccine.ID, sibling.ID, family, MarkVaccineGivenRequest{GivenDate: "2026-01-03"}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatal("sibling given", err)
	}
	var wg sync.WaitGroup
	failures := make(chan error, 40)
	for i := 0; i < 20; i++ {
		wg.Add(2)
		go func() { defer wg.Done(); _, err := svc.GetVaccines(kid.ID, family); failures <- err }()
		go func() {
			defer wg.Done()
			_, err := svc.MarkVaccineGiven(vaccine.ID, kid.ID, family, MarkVaccineGivenRequest{GivenDate: "2026-01-03"})
			failures <- err
		}()
	}
	wg.Wait()
	close(failures)
	for err := range failures {
		if err != nil {
			t.Fatal(err)
		}
	}
	list, err = svc.GetVaccines(kid.ID, family)
	if err != nil || list[0].Status != models.VaccineStatusGiven || list[0].GivenBy != "Klinik" || list[0].Notes != "Simpan catatan" || list[0].GivenDate == nil {
		t.Fatal("concurrent given lost metadata", list, err)
	}
	vaccine, err = svc.UpdateVaccine(vaccine.ID, kid.ID, family, CreateVaccineRequest{VaccineName: "Vaksin koreksi", ScheduledDate: "2026-01-04"})
	if err != nil || vaccine.GivenDate != nil || vaccine.GivenBy != "" || vaccine.Notes != "" {
		t.Fatal("vaccine correction", vaccine, err)
	}
	milestone, err := svc.AddMilestone(kid.ID, family, CreateMilestoneRequest{Title: "Bersepeda", Category: "motorik"})
	if err != nil {
		t.Fatal(err)
	}
	if _, err = svc.SetMilestoneAchievement(milestone.ID, sibling.ID, family, AchievementRequest{Achieved: true}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatal("sibling achievement", err)
	}
	failures = make(chan error, 10)
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := svc.SetMilestoneAchievement(milestone.ID, kid.ID, family, AchievementRequest{Achieved: true})
			failures <- err
		}()
	}
	wg.Wait()
	close(failures)
	for err := range failures {
		if err != nil {
			t.Fatal(err)
		}
	}
	milestones, err := svc.GetMilestones(kid.ID, family)
	if err != nil || !milestones[0].IsAchieved || kidDate(*milestones[0].AchievedAt) != kidsToday() {
		t.Fatal(milestones, err)
	}
	milestone, err = svc.SetMilestoneAchievement(milestone.ID, kid.ID, family, AchievementRequest{Achieved: false})
	if err != nil || milestone.IsAchieved || milestone.AchievedAt != nil {
		t.Fatal("reopen", milestone, err)
	}
	achieved := "2026-01-10"
	milestone, err = svc.UpdateMilestone(milestone.ID, kid.ID, family, CreateMilestoneRequest{Title: "Bersepeda", AchievedAt: &achieved})
	if err != nil || !milestone.IsAchieved {
		t.Fatal(milestone, err)
	}
	health, err := svc.AddHealth(kid.ID, family, CreateHealthRequest{Type: "checkup", Date: "2026-01-01", Description: "Kontrol", Doctor: "Dokter", Medication: "Obat", Notes: "Note"})
	if err != nil {
		t.Fatal(err)
	}
	health, err = svc.UpdateHealth(health.ID, kid.ID, family, CreateHealthRequest{Type: "dental", Date: "2026-01-02", Description: "Gigi"})
	if err != nil || health.Doctor != "" || health.Medication != "" || health.Notes != "" {
		t.Fatal(health, err)
	}
	if err = svc.DeleteHealth(health.ID, sibling.ID, family); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatal("sibling health delete", err)
	}
	// Parent deletion and a concurrent child write share the same lock; no live orphan survives.
	wg.Add(2)
	failures = make(chan error, 2)
	go func() { defer wg.Done(); failures <- svc.DeleteKid(kid.ID, family) }()
	go func() {
		defer wg.Done()
		_, err := svc.AddGrowth(kid.ID, family, CreateGrowthRequest{Date: "2026-01-01", WeightKg: &val})
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = nil
		}
		failures <- err
	}()
	wg.Wait()
	close(failures)
	for err := range failures {
		if err != nil {
			t.Fatal(err)
		}
	}
	for _, model := range []interface{}{&models.GrowthRecord{}, &models.VaccineRecord{}, &models.Milestone{}, &models.HealthRecord{}} {
		var count int64
		db.Model(model).Where("kid_id = ?", kid.ID).Count(&count)
		if count != 0 {
			t.Fatal("live orphan after parent deleted", count)
		}
	}
	if _, err = svc.UpdateKid(kid.ID, family, UpdateKidRequest{Notes: &note}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatal("deleted profile revived", err)
	}
	kids, err := svc.GetKids(family)
	if err != nil || len(kids) != 1 || kids[0].ID != sibling.ID {
		t.Fatal(kids, err)
	}
}
