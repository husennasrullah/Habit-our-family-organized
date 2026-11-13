package services

import (
	"errors"
	"github.com/google/uuid"
	"keluarga-app/backend/internal/models"
	"math"
	"net/url"
	"sort"
	"strings"
	"time"
)

func tripDates(start, end string) error {
	if !validDate(start) || !validDate(end) || end < start {
		return errors.New("tanggal perjalanan tidak valid; tanggal pulang tidak boleh sebelum berangkat")
	}
	return nil
}
func tripEvent(trip *models.Trip) *models.Event {
	zone := time.FixedZone("WIB", 7*3600)
	start, _ := time.ParseInLocation("2006-01-02", trip.StartDate[:10], zone)
	end, _ := time.ParseInLocation("2006-01-02", trip.EndDate[:10], zone)
	return &models.Event{FamilyID: trip.FamilyID, CreatedBy: trip.CreatedBy, Title: "🏖️ " + trip.Title + " (" + trip.Destination + ")", Description: trip.Notes, StartAt: start.UTC().Format(time.RFC3339), EndAt: end.AddDate(0, 0, 1).Add(-time.Second).UTC().Format(time.RFC3339), IsAllDay: true, Type: models.EventTypeVacation, Color: "emerald"}
}
func validTrip(trip *models.Trip) error {
	trip.Title = strings.TrimSpace(trip.Title)
	trip.Destination = strings.TrimSpace(trip.Destination)
	if trip.Title == "" || trip.Destination == "" {
		return errors.New("judul dan tujuan wajib diisi")
	}
	trip.StartDate = strings.Split(trip.StartDate, "T")[0]
	trip.EndDate = strings.Split(trip.EndDate, "T")[0]
	if err := tripDates(trip.StartDate, trip.EndDate); err != nil {
		return err
	}
	if !validMoney(trip.BudgetEstimate, true) {
		return errors.New("anggaran tidak valid")
	}
	switch trip.Status {
	case models.TripStatusPlanning, models.TripStatusOngoing, models.TripStatusCompleted, models.TripStatusCancelled:
	default:
		return errors.New("status perjalanan tidak valid")
	}
	if trip.CoverImageURL != "" && !httpURL(trip.CoverImageURL) {
		return errors.New("alamat foto harus berupa URL HTTP/HTTPS")
	}
	return nil
}
func httpURL(s string) bool {
	u, e := url.Parse(s)
	return e == nil && u.Host != "" && (u.Scheme == "https" || u.Scheme == "http")
}
func validateItinerary(item *models.TripItinerary, trip *models.Trip) error {
	start, _ := time.Parse("2006-01-02", trip.StartDate[:10])
	end, _ := time.Parse("2006-01-02", trip.EndDate[:10])
	days := int(end.Sub(start).Hours()/24) + 1
	if item.DayNumber < 1 || item.DayNumber > days {
		return errors.New("hari kegiatan berada di luar tanggal perjalanan")
	}
	expected := start.AddDate(0, 0, item.DayNumber-1).Format("2006-01-02")
	if item.Date != nil && *item.Date != "" && strings.Split(*item.Date, "T")[0] != expected {
		return errors.New("tanggal kegiatan tidak sesuai hari perjalanan")
	}
	item.Date = &expected
	item.Title = strings.TrimSpace(item.Title)
	if item.Title == "" {
		return errors.New("nama kegiatan wajib diisi")
	}
	if (item.TimeStart == "") != (item.TimeEnd == "") {
		return errors.New("isi jam mulai dan selesai, atau kosongkan keduanya")
	}
	if item.TimeStart != "" {
		if _, e := time.Parse("15:04", item.TimeStart); e != nil {
			return errors.New("jam mulai tidak valid")
		}
		if _, e := time.Parse("15:04", item.TimeEnd); e != nil {
			return errors.New("jam selesai tidak valid")
		}
		if item.TimeEnd <= item.TimeStart {
			return errors.New("jam selesai harus setelah jam mulai; kegiatan lintas tengah malam dipisah per hari")
		}
	}
	if item.LocationURL != "" && !httpURL(item.LocationURL) {
		return errors.New("tautan lokasi harus berupa URL HTTP/HTTPS")
	}
	// Overlapping family activities are permitted and exposed as warnings in the UI.
	return nil
}
func validateBudgetRows(req []ItineraryBudgetRow) ([]models.TripItineraryBudget, error) {
	rows := make([]models.TripItineraryBudget, 0, len(req))
	seen := map[uuid.UUID]bool{}
	for _, b := range req {
		b.Label = strings.TrimSpace(b.Label)
		if b.Label == "" || !validMoney(b.Amount, false) {
			return nil, errors.New("rincian biaya wajib berisi nama dan nominal positif (maksimal dua desimal)")
		}
		if b.ID != uuid.Nil && seen[b.ID] {
			return nil, errors.New("rincian biaya berulang")
		}
		seen[b.ID] = true
		rows = append(rows, models.TripItineraryBudget{ID: b.ID, Label: b.Label, Amount: b.Amount})
	}
	return rows, nil
}
func validateTripExpense(req *CreateTripExpenseRequest, trip *models.Trip) ([]models.TripExpenseSplit, error) {
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" || !validMoney(req.Amount, false) {
		return nil, errors.New("judul dan nominal pengeluaran positif wajib diisi")
	}
	if !validDate(req.Date) {
		return nil, errors.New("tanggal transaksi tidak valid")
	}
	if req.Category == "" {
		req.Category = "Lain-lain"
	}
	if req.SplitType == "" {
		req.SplitType = "all"
	}
	participants := map[uuid.UUID]bool{}
	for _, m := range trip.Members {
		participants[m.ID] = true
	}
	if req.PaidBy != nil && !participants[*req.PaidBy] {
		return nil, errors.New("pembayar harus anggota perjalanan")
	}
	rows := make([]models.TripExpenseSplit, 0)
	switch req.SplitType {
	case "none":
		if len(req.Splits) > 0 {
			return nil, errors.New("pengeluaran tanpa pembagian tidak boleh berisi rincian bagian")
		}
	case "all":
		if len(trip.Members) == 0 {
			return nil, errors.New("tambahkan anggota perjalanan sebelum membagi biaya")
		}
		if req.PaidBy == nil {
			return nil, errors.New("pilih anggota yang membayar")
		}
		ids := make([]uuid.UUID, 0, len(trip.Members))
		for _, m := range trip.Members {
			ids = append(ids, m.ID)
		}
		sort.Slice(ids, func(i, j int) bool { return ids[i].String() < ids[j].String() })
		cents := int64(math.Round(req.Amount * 100))
		base := cents / int64(len(ids))
		remainder := cents % int64(len(ids))
		for i, id := range ids {
			n := base
			if int64(i) < remainder {
				n++
			}
			rows = append(rows, models.TripExpenseSplit{MemberID: id, Amount: float64(n) / 100, IsSettled: id == *req.PaidBy || n == 0})
		}
	case "custom":
		if req.PaidBy == nil || len(req.Splits) == 0 {
			return nil, errors.New("pilih pembayar dan rincian pembagian")
		}
		var total int64
		seen := map[uuid.UUID]bool{}
		for _, sp := range req.Splits {
			if !participants[sp.MemberID] || seen[sp.MemberID] || !validMoney(sp.Amount, true) {
				return nil, errors.New("anggota atau nominal pembagian tidak valid")
			}
			seen[sp.MemberID] = true
			total += int64(math.Round(sp.Amount * 100))
			rows = append(rows, models.TripExpenseSplit{MemberID: sp.MemberID, Amount: sp.Amount, IsSettled: sp.IsSettled || sp.MemberID == *req.PaidBy || sp.Amount == 0})
		}
		if total != int64(math.Round(req.Amount*100)) {
			return nil, errors.New("jumlah pembagian harus sama dengan total pengeluaran")
		}
	default:
		return nil, errors.New("jenis pembagian tidak valid")
	}
	return rows, nil
}
