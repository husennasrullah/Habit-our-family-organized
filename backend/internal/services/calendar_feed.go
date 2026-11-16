package services

import (
	"errors"
	"fmt"
	"github.com/google/uuid"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	"net/url"
	"sort"
	"strings"
	"time"
)

var ErrCalendarRange = errors.New("pilih rentang kalender yang valid, maksimal 366 hari")
var calendarLocation = time.FixedZone("WIB", 7*60*60)

func calendarRange(req GetEventsRequest) (time.Time, time.Time, error) {
	now := time.Now().In(calendarLocation)
	from := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, calendarLocation)
	to := from.AddDate(0, 1, 0).Add(-time.Nanosecond)
	var err error
	parse := func(raw string) (time.Time, error) {
		if len(raw) == 10 {
			return time.ParseInLocation("2006-01-02", raw, calendarLocation)
		}
		return time.Parse(time.RFC3339Nano, raw)
	}
	if req.From != "" {
		from, err = parse(req.From)
		if err != nil {
			return from, to, ErrCalendarRange
		}
	}
	if req.To != "" {
		to, err = parse(req.To)
		if err != nil {
			return from, to, ErrCalendarRange
		}
		if len(req.To) == 10 {
			to = to.AddDate(0, 0, 1).Add(-time.Nanosecond)
		}
	}
	if from.Year() < 1 || to.Year() > 9999 || to.Before(from) || to.Sub(from) > 366*24*time.Hour {
		return from, to, ErrCalendarRange
	}
	return from, to, nil
}

func (s *EventService) CalendarFeed(req GetEventsRequest, familyID uuid.UUID, role string) ([]models.Event, error) {
	if familyID == uuid.Nil {
		return nil, ErrCalendarRange
	}
	from, to, err := calendarRange(req)
	if err != nil {
		return nil, err
	}
	// A projection keeps existing and future edits in sync without backfills or duplicated event rows.
	native, err := s.eventRepo.GetByDateRange(familyID, from.Format(time.RFC3339Nano), to.Format(time.RFC3339Nano))
	if err != nil {
		return nil, err
	}
	tripEvents, err := s.eventRepo.TripEventIDs(familyID)
	if err != nil {
		return nil, err
	}
	result := make([]models.Event, 0, len(native))
	for _, e := range native {
		if tripEvents[e.ID] {
			continue
		}
		e.Source = "event"
		result = append(result, e)
	}
	rows, err := s.eventRepo.CalendarRows(familyID, from.In(calendarLocation).Format("2006-01-02"), to.In(calendarLocation).Format("2006-01-02"), role == "admin" || role == "member")
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		for _, event := range calendarRowEvents(row, familyID, from, to) {
			result = append(result, event)
		}
	}
	sort.SliceStable(result, func(i, j int) bool {
		a, _ := time.Parse(time.RFC3339Nano, result[i].StartAt)
		b, _ := time.Parse(time.RFC3339Nano, result[j].StartAt)
		if a.Equal(b) {
			return result[i].ID.String() < result[j].ID.String()
		}
		return a.Before(b)
	})
	return result, nil
}
func calendarRowEvents(row repositories.CalendarRow, familyID uuid.UUID, from, to time.Time) []models.Event {
	raw := row.Date
	if len(raw) > 10 {
		raw = raw[:10]
	}
	day, err := time.ParseInLocation("2006-01-02", raw, calendarLocation)
	if err != nil || day.Year() < 1 {
		return nil
	}
	birthday := row.Source == "birthday" || row.Source == "kid_birthday"
	dates := []time.Time{day}
	if birthday {
		dates = nil
		for year := from.In(calendarLocation).Year(); year <= to.In(calendarLocation).Year(); year++ {
			if year < day.Year() {
				continue
			}
			d := time.Date(year, day.Month(), day.Day(), 0, 0, 0, 0, calendarLocation)
			if d.Month() == day.Month() && d.Day() == day.Day() {
				dates = append(dates, d)
			}
		}
	}
	result := make([]models.Event, 0, len(dates))
	for _, start := range dates {
		end := start.AddDate(0, 0, 1).Add(-time.Second)
		allDay := true
		if !birthday && row.EndDate != "" {
			d, e := time.ParseInLocation("2006-01-02", row.EndDate[:min(len(row.EndDate), 10)], calendarLocation)
			if e != nil || d.Before(start) {
				continue
			}
			end = d.AddDate(0, 0, 1).Add(-time.Second)
		}
		if row.Source == "itinerary" && row.StartTime != "" {
			s, e := time.ParseInLocation("2006-01-02 15:04", raw+" "+row.StartTime, calendarLocation)
			if e != nil {
				continue
			}
			start = s
			end = start.Add(time.Hour)
			if row.EndTime != "" {
				end, e = time.ParseInLocation("2006-01-02 15:04", raw+" "+row.EndTime, calendarLocation)
				if e != nil || !end.After(start) {
					continue
				}
			}
			allDay = false
		}
		if start.After(to) || end.Before(from) {
			continue
		}
		source := row.Source
		href := ""
		prefix := ""
		color := "sky"
		kind := models.EventTypeGeneral
		date := start.Format("2006-01-02")
		q := url.Values{"date": {date}, "record": {row.ID}}
		switch source {
		case "task":
			prefix = "Tugas · "
			color = "amber"
			href = "/tasks"
		case "meal":
			labels := map[string]string{"breakfast": "Sarapan", "lunch": "Makan siang", "dinner": "Makan malam"}
			prefix = labels[row.Status] + " · "
			color = "orange"
			href = "/meals"
		case "trip":
			color = "teal"
			kind = models.EventTypeVacation
			href = "/trips/" + row.ID
		case "itinerary":
			color = "teal"
			kind = models.EventTypeVacation
			href = "/trips/" + row.ParentID
			q.Set("itinerary", row.ID)
		case "memory":
			prefix = "Kenangan · "
			color = "pink"
			href = "/memories"
		case "birthday", "kid_birthday":
			prefix = "Ulang tahun · "
			color = "rose"
			kind = models.EventTypeBirthday
			if source == "kid_birthday" {
				href = "/kids"
				q.Set("kid", row.ParentID)
			} else {
				href = "/settings"
			}
			source = "birthday"
		case "vaccine", "growth", "health", "milestone":
			href = "/kids"
			q.Set("kid", row.ParentID)
			tabs := map[string]string{"vaccine": "vaccines", "growth": "growth", "health": "health", "milestone": "milestones"}
			q.Set("tab", tabs[source])
			color = "violet"
			kind = models.EventTypeMedical
			if source == "vaccine" {
				prefix = "Vaksin · "
				if row.Status != "given" && date < time.Now().In(calendarLocation).Format("2006-01-02") {
					row.Status = "overdue"
				}
			}
		case "goal":
			prefix = "Target tabungan · "
			color = "emerald"
			href = "/budget"
			q.Set("tab", "goals")
		case "expense":
			prefix = "Pengeluaran · "
			color = "emerald"
			href = "/budget"
			q.Set("tab", "expenses")
		case "budget":
			color = "emerald"
			href = "/budget"
			q.Set("tab", "budgets")
		case "trip_expense":
			prefix = "Biaya liburan · "
			color = "emerald"
			href = "/trips/" + row.ParentID
			q.Set("tab", "expenses")
		default:
			continue
		}
		id := uuid.NewSHA1(uuid.NameSpaceOID, []byte(fmt.Sprintf("%s:%s:%s", row.Source, row.ID, date)))
		event := models.Event{FamilyID: familyID, Title: prefix + strings.TrimSpace(row.Title), Description: row.Description, StartAt: start.Format(time.RFC3339), EndAt: end.Format(time.RFC3339), IsAllDay: allDay, Color: color, Type: kind, Source: source, SourceID: row.ID, SourceURL: href + "?" + q.Encode(), ReadOnly: true, SourceStatus: row.Status}
		event.ID = id
		result = append(result, event)
	}
	return result
}
