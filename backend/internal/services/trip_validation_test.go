package services

import (
	"github.com/google/uuid"
	"keluarga-app/backend/internal/models"
	"testing"
)

func TestTripDatesAndItinerary(t *testing.T) {
	for _, dates := range [][2]string{{"2026-02-30", "2026-03-01"}, {"2026-11-14", "2026-11-13"}, {"", ""}} {
		if tripDates(dates[0], dates[1]) == nil {
			t.Fatalf("accepted invalid dates %v", dates)
		}
	}
	trip := &models.Trip{StartDate: "2026-11-13", EndDate: "2026-11-14"}
	stored := "2026-11-14T00:00:00Z"
	item := &models.TripItinerary{Title: "Museum", DayNumber: 2, Date: &stored, TimeStart: "09:00", TimeEnd: "10:00"}
	if err := validateItinerary(item, trip); err != nil {
		t.Fatal(err)
	}
	if *item.Date != "2026-11-14" {
		t.Fatal("stored date not normalized")
	}
	item.DayNumber = 3
	if validateItinerary(item, trip) == nil {
		t.Fatal("accepted day outside trip")
	}
	item.DayNumber = 2
	item.TimeEnd = "08:00"
	if validateItinerary(item, trip) == nil {
		t.Fatal("accepted reversed time range")
	}
}

func TestTripExpenseAllocation(t *testing.T) {
	a, b, c := uuid.New(), uuid.New(), uuid.New()
	trip := &models.Trip{Members: []models.FamilyMember{{BaseModel: models.BaseModel{ID: a}}, {BaseModel: models.BaseModel{ID: b}}, {BaseModel: models.BaseModel{ID: c}}}}
	req := &CreateTripExpenseRequest{Title: "Tiket", Amount: 100, Date: "2026-11-13", PaidBy: &a, SplitType: "all"}
	rows, err := validateTripExpense(req, trip)
	if err != nil {
		t.Fatal(err)
	}
	var cents int
	for _, row := range rows {
		cents += int(row.Amount*100 + 0.5)
		if row.MemberID == a && !row.IsSettled {
			t.Fatal("payer should be settled")
		}
	}
	if cents != 10000 || len(rows) != 3 {
		t.Fatalf("incorrect allocation: %v", rows)
	}
	foreign := uuid.New()
	req.PaidBy = &foreign
	if _, err := validateTripExpense(req, trip); err == nil {
		t.Fatal("accepted nonparticipant payer")
	}
	req.PaidBy = &a
	req.SplitType = "custom"
	req.Splits = []ExpenseSplitItemRequest{{MemberID: a, Amount: 60}, {MemberID: b, Amount: 30}}
	if _, err := validateTripExpense(req, trip); err == nil {
		t.Fatal("accepted incomplete allocation")
	}
	req.Splits[1].Amount = 40
	if _, err := validateTripExpense(req, trip); err != nil {
		t.Fatal(err)
	}
	req.SplitType = "none"
	req.Splits = nil
	rows, err = validateTripExpense(req, trip)
	if err != nil || len(rows) != 0 || rows == nil {
		t.Fatal("none must return an empty replacement allocation")
	}
}

func TestTripCalendarEndsOnReturnDay(t *testing.T) {
	trip := &models.Trip{StartDate: "2026-11-13", EndDate: "2026-11-14"}
	event := tripEvent(trip)
	if event.StartAt != "2026-11-12T17:00:00Z" || event.EndAt != "2026-11-14T16:59:59Z" {
		t.Fatalf("incorrect inclusive calendar range: %s %s", event.StartAt, event.EndAt)
	}
}

func TestTripBudgetRows(t *testing.T) {
	id := uuid.New()
	for _, rows := range [][]ItineraryBudgetRow{{{Label: "", Amount: 10}}, {{Label: "Tiket", Amount: -1}}, {{Label: "A", Amount: 1.001}}, {{ID: id, Label: "A", Amount: 1}, {ID: id, Label: "B", Amount: 1}}} {
		if _, err := validateBudgetRows(rows); err == nil {
			t.Fatalf("accepted invalid rows %v", rows)
		}
	}
	if _, err := validateBudgetRows([]ItineraryBudgetRow{{Label: "A", Amount: 10}, {Label: "B", Amount: 20}}); err != nil {
		t.Fatal(err)
	}
}
