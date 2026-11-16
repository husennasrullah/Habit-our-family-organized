package services

import (
	"errors"
	"keluarga-app/backend/internal/models"
	"strings"
	"time"
	"unicode/utf8"
)

func validateEventValues(e *models.Event) error {
	e.Title = strings.TrimSpace(e.Title)
	if e.Title == "" || utf8.RuneCountInString(e.Title) > 160 || utf8.RuneCountInString(e.Description) > 20000 {
		return errors.New("judul wajib 1–160 karakter dan deskripsi maksimal 20.000 karakter")
	}
	start, err := time.Parse(time.RFC3339Nano, e.StartAt)
	if err != nil {
		return errors.New("waktu mulai tidak valid")
	}
	end, err := time.Parse(time.RFC3339Nano, e.EndAt)
	if err != nil || !end.After(start) {
		return errors.New("waktu selesai harus setelah waktu mulai")
	}
	if start.Year() < 1 || end.Year() > 9999 {
		return errors.New("tanggal tidak valid")
	}
	switch e.Type {
	case models.EventTypeGeneral, models.EventTypeSchool, models.EventTypeMedical, models.EventTypeBirthday, models.EventTypeVacation:
	default:
		return errors.New("tipe acara tidak valid")
	}
	if e.ReminderMinutes < 0 || e.ReminderMinutes > 10080 {
		return errors.New("pengingat harus 0–10.080 menit")
	}
	e.StartAt = start.UTC().Format(time.RFC3339Nano)
	e.EndAt = end.UTC().Format(time.RFC3339Nano)
	return nil
}
