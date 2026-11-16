package services

import (
	"errors"
	"github.com/google/uuid"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	"strings"
	"testing"
	"time"
)

func TestCalendarDatesAndBirthdays(t *testing.T) {
	family := uuid.New()
	from, to, err := calendarRange(GetEventsRequest{From: "2026-11-16", To: "2026-11-16"})
	if err != nil || from.Format(time.RFC3339) != "2026-11-16T00:00:00+07:00" || to.Day() != 16 {
		t.Fatal(from, to, err)
	}
	for _, r := range []GetEventsRequest{{From: "bad", To: "2026-11-16"}, {From: "2026-02-30", To: "2026-03-01"}, {From: "2026-11-17", To: "2026-11-16"}, {From: "2026-01-01", To: "2028-01-01"}} {
		if _, _, e := calendarRange(r); !errors.Is(e, ErrCalendarRange) {
			t.Fatal("range accepted", r, e)
		}
	}
	row := repositories.CalendarRow{ID: uuid.NewString(), Source: "birthday", Title: "Bima", Date: "1990-11-16"}
	events := calendarRowEvents(row, family, from, to)
	if len(events) != 1 || events[0].StartAt != "2026-11-16T00:00:00+07:00" || !events[0].ReadOnly {
		t.Fatal(events)
	}
	again := calendarRowEvents(row, family, from, to)
	if again[0].ID != events[0].ID {
		t.Fatal("unstable source ID")
	}
	row.Date = "2027-11-16"
	if len(calendarRowEvents(row, family, from, to)) != 0 {
		t.Fatal("birthday before birth")
	}
	row.Date = "2020-02-29"
	leapFrom, leapTo, _ := calendarRange(GetEventsRequest{From: "2028-02-01", To: "2028-02-29"})
	if len(calendarRowEvents(row, family, leapFrom, leapTo)) != 1 {
		t.Fatal("leap birthday missing")
	}
	leapFrom, leapTo, _ = calendarRange(GetEventsRequest{From: "2027-02-01", To: "2027-03-01"})
	if len(calendarRowEvents(row, family, leapFrom, leapTo)) != 0 {
		t.Fatal("invented non-leap birthday")
	}
	row.Source = "itinerary"
	row.Date = "2026-11-16"
	row.StartTime = "09:00"
	row.EndTime = "10:00"
	events = calendarRowEvents(row, family, from, to)
	if len(events) != 1 || events[0].IsAllDay || events[0].StartAt != "2026-11-16T09:00:00+07:00" {
		t.Fatal(events)
	}
}
func TestCalendarNativeValidation(t *testing.T) {
	e := models.Event{Title: "  Acara  ", StartAt: "2026-11-16T09:00:00+07:00", EndAt: "2026-11-16T10:00:00+07:00", Type: models.EventTypeGeneral}
	if err := validateEventValues(&e); err != nil || e.StartAt != "2026-11-16T02:00:00Z" || e.Title != "Acara" {
		t.Fatal(e, err)
	}
	for _, patch := range []func(*models.Event){func(e *models.Event) { e.Title = " " }, func(e *models.Event) { e.EndAt = e.StartAt }, func(e *models.Event) { e.StartAt = "2026-02-30T09:00:00Z" }, func(e *models.Event) { e.Type = "invalid" }} {
		copy := e
		patch(&copy)
		if validateEventValues(&copy) == nil {
			t.Fatal("invalid event accepted")
		}
	}
}
func TestCalendarFeedProjectsSourcesAndIsolation(t *testing.T) {
	db := financeDB(t)
	db.Config.DisableForeignKeyConstraintWhenMigrating = true
	if err := db.AutoMigrate(&models.Family{}, &models.FamilyMember{}, &models.Event{}, &models.Task{}, &models.MealPlan{}, &models.Memory{}, &models.KidProfile{}, &models.VaccineRecord{}, &models.GrowthRecord{}, &models.HealthRecord{}, &models.Milestone{}, &models.Trip{}, &models.TripItinerary{}, &models.TripExpense{}); err != nil {
		t.Fatal(err)
	}
	family, foreign, user := uuid.New(), uuid.New(), uuid.New()
	day := "2026-11-16"
	birth := "1990-11-16"
	kidBirth := "2020-11-16"
	deadline := "2026-11-16"
	member := models.FamilyMember{Name: "Bima", Email: "bima@example.test", FamilyID: &family, BirthDate: &birth}
	member.ID = user
	kid := models.KidProfile{FamilyID: family, Name: "Aruna", BirthDate: kidBirth}
	linkedMember := models.FamilyMember{Name: "Aruna", Email: "aruna@example.test", FamilyID: &family, BirthDate: &kidBirth}
	if err := db.Create(&linkedMember).Error; err != nil {
		t.Fatal(err)
	}
	kid.MemberID = &linkedMember.ID
	if err := db.Create(&kid).Error; err != nil {
		t.Fatal(err)
	}
	native := models.Event{FamilyID: family, CreatedBy: user, Title: "Acara", StartAt: day + "T08:00:00+07:00", EndAt: day + "T09:00:00+07:00", Type: models.EventTypeGeneral}
	legacyTripEvent := models.Event{FamilyID: family, CreatedBy: user, Title: "Liburan lama", StartAt: day + "T00:00:00+07:00", EndAt: day + "T23:59:59+07:00", Type: models.EventTypeVacation}
	if err := db.Create(&legacyTripEvent).Error; err != nil {
		t.Fatal(err)
	}
	trip := models.Trip{FamilyID: family, CreatedBy: user, Title: "Bandung", Destination: "Bandung", StartDate: day, EndDate: day, EventID: &legacyTripEvent.ID}
	if err := db.Create(&trip).Error; err != nil {
		t.Fatal(err)
	}
	memory := models.Memory{FamilyID: family, CreatedBy: user, Title: "Piknik", Date: day}
	task := models.Task{FamilyID: family, CreatedBy: user, Title: "Bekal", DueDate: &deadline}
	fixtures := []interface{}{&member, &native, &task, &memory,
		&models.MealPlan{FamilyID: family, CreatedBy: user, Name: "Nasi", Date: day, MealType: "breakfast"},
		&models.FinancialGoal{FamilyID: family, CreatedBy: user, Title: "Tabungan", TargetAmount: 100, Deadline: &deadline},
		&models.Expense{FamilyID: family, CreatedBy: user, Category: "Makan", Amount: 50, Date: day},
		&models.Budget{FamilyID: family, Category: "Makan", Amount: 100, Month: 11, Year: 2026},
		&models.TripItinerary{TripID: trip.ID, Title: "Museum", DayNumber: 1, TimeStart: "09:00", TimeEnd: "10:00"},
		&models.TripExpense{TripID: trip.ID, FamilyID: family, Title: "Tiket", Date: day, Amount: 10},
		&models.VaccineRecord{KidID: kid.ID, VaccineName: "Vaksin", ScheduledDate: day, Status: "scheduled"},
		&models.GrowthRecord{KidID: kid.ID, Date: day},
		&models.HealthRecord{KidID: kid.ID, Date: day, Type: "checkup", Description: "Kontrol"},
		&models.Milestone{KidID: kid.ID, Title: "Berjalan", IsAchieved: true, AchievedAt: &deadline},
		&models.Task{FamilyID: foreign, CreatedBy: user, Title: "RAHASIA", DueDate: &deadline},
		&models.Memory{FamilyID: foreign, CreatedBy: user, Title: "RAHASIA", Date: day},
		&models.KidProfile{FamilyID: foreign, Name: "RAHASIA", BirthDate: kidBirth},
		&models.Memory{FamilyID: family, CreatedBy: user, Title: "Pending", Date: day, StorageDeletePending: true},
	}
	for _, fixture := range fixtures {
		if err := db.Create(fixture).Error; err != nil {
			t.Fatal(err)
		}
	}
	svc := NewEventService(repositories.NewEventRepository(db))
	req := GetEventsRequest{From: day, To: day}
	events, err := svc.CalendarFeed(req, family, "admin")
	if err != nil {
		t.Fatal(err)
	}
	counts := map[string]int{}
	for _, event := range events {
		counts[event.Source]++
		if event.FamilyID != family || strings.Contains(event.Title, "RAHASIA") || strings.Contains(event.Title, "Pending") {
			t.Fatal("foreign/pending exposed", event)
		}
		if event.Source != "event" && (!event.ReadOnly || event.SourceURL == "") {
			t.Fatal("source writable/unlinked", event)
		}
	}
	for _, source := range []string{"event", "task", "meal", "trip", "itinerary", "memory", "vaccine", "growth", "health", "milestone", "goal", "expense", "budget", "trip_expense"} {
		if counts[source] != 1 {
			t.Fatalf("source %s count %d: %+v", source, counts[source], counts)
		}
	}
	if counts["birthday"] != 2 {
		t.Fatal("birthday duplication/missing", counts)
	}
	if _, err := svc.Update(legacyTripEvent.ID, UpdateEventRequest{}, family); err == nil {
		t.Fatal("linked trip editable through events")
	}
	if err := svc.Delete(legacyTripEvent.ID, family); err == nil {
		t.Fatal("linked trip deletable through events")
	}
	limited, err := svc.CalendarFeed(req, family, "view_only")
	if err != nil {
		t.Fatal(err)
	}
	for _, event := range limited {
		switch event.Source {
		case "vaccine", "growth", "health", "milestone", "goal", "expense", "budget", "trip_expense":
			t.Fatal("restricted source exposed", event.Source)
		}
	}
	moved := "2026-11-20"
	if err := db.Model(&task).Update("due_date", moved).Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Delete(&memory).Error; err != nil {
		t.Fatal(err)
	}
	events, err = svc.CalendarFeed(req, family, "admin")
	if err != nil {
		t.Fatal(err)
	}
	for _, event := range events {
		if event.Source == "task" || event.Source == "memory" {
			t.Fatal("stale projection", event)
		}
	}
	events, err = svc.CalendarFeed(GetEventsRequest{From: moved, To: moved}, family, "admin")
	if err != nil {
		t.Fatal(err)
	}
	found := false
	for _, event := range events {
		if event.Source == "task" {
			found = true
		}
	}
	if !found {
		t.Fatal("date edit not reflected")
	}
	previous := "2026-11-15"
	given := models.VaccineRecord{KidID: kid.ID, VaccineName: "Tanggal aktual", ScheduledDate: previous, GivenDate: &day, Status: "given"}
	if e := db.Create(&given).Error; e != nil {
		t.Fatal(e)
	}
	for _, date := range []string{previous, day} {
		records, e := svc.CalendarFeed(GetEventsRequest{From: date, To: date}, family, "admin")
		if e != nil {
			t.Fatal(e)
		}
		foundGiven := false
		for _, entry := range records {
			if entry.Source == "vaccine" && entry.SourceID == given.ID.String() {
				foundGiven = true
			}
		}
		if !foundGiven {
			t.Fatal("vaccine planned/actual date missing", date)
		}
	}

	// Comparing timestamp instants must not depend on their textual UTC offsets.
	crossing := models.Event{FamilyID: family, CreatedBy: user, Title: "Beda offset", StartAt: "2026-11-15T23:00:00-07:00", EndAt: "2026-11-16T00:00:00-07:00"}
	if err := db.Create(&crossing).Error; err != nil {
		t.Fatal(err)
	}
	events, err = svc.CalendarFeed(req, family, "admin")
	if err != nil {
		t.Fatal(err)
	}
	found = false
	for _, event := range events {
		if event.ID == crossing.ID {
			found = true
		}
	}
	if !found {
		t.Fatal("offset event missing")
	}
}
