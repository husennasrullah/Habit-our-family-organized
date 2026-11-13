package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"

	"github.com/google/uuid"
)

// ─── DTOs ────────────────────────────────────────────────────────────────────

type CreateTaskRequest struct {
	Title          string            `json:"title"           validate:"required"`
	Description    string            `json:"description"`
	AssignedTo     *uuid.UUID        `json:"assigned_to"`
	Points         int               `json:"points"`
	Status         models.TaskStatus `json:"status"`
	DueDate        *string           `json:"due_date"`
	IsRecurring    bool              `json:"is_recurring"`
	RecurrenceRule string            `json:"recurrence_rule"`
}

type UpdateTaskRequest struct {
	Title          *string              `json:"title"`
	Description    *string              `json:"description"`
	AssignedTo     TaskField[uuid.UUID] `json:"assigned_to"`
	Points         *int                 `json:"points"`
	Status         *models.TaskStatus   `json:"status"`
	DueDate        TaskField[string]    `json:"due_date"`
	IsRecurring    *bool                `json:"is_recurring"`
	RecurrenceRule *string              `json:"recurrence_rule"`
}

type GetTasksRequest struct {
	AssignedTo string `query:"assigned_to"`
	Status     string `query:"status"`
	DueDate    string `query:"due_date"`
}

// ─── Service ─────────────────────────────────────────────────────────────────

type TaskService struct {
	taskRepo *repositories.TaskRepository
}

func NewTaskService(taskRepo *repositories.TaskRepository) *TaskService {
	return &TaskService{taskRepo: taskRepo}
}

// TaskField distinguishes omitted update fields from explicit null (clear).
type TaskField[T any] struct {
	Present bool
	Value   *T
}

func (f *TaskField[T]) UnmarshalJSON(data []byte) error {
	f.Present = true
	if bytes.Equal(bytes.TrimSpace(data), []byte("null")) {
		f.Value = nil
		return nil
	}
	return json.Unmarshal(data, &f.Value)
}
func validTask(task *models.Task) error {
	task.Title = strings.TrimSpace(task.Title)
	if task.Title == "" {
		return errors.New("judul tugas wajib diisi")
	}
	if task.Points < 0 || task.Points > 1000 {
		return errors.New("poin harus berupa bilangan bulat antara 0 dan 1000")
	}
	switch task.Status {
	case models.TaskStatusPending, models.TaskStatusInProgress, models.TaskStatusDone:
	default:
		return errors.New("status tugas tidak valid")
	}
	if task.DueDate != nil && !validDate(*task.DueDate) {
		return errors.New("tanggal tenggat tidak valid")
	}
	return nil
}
func taskCompletion(task *models.Task, previous models.TaskStatus, now time.Time) {
	if task.Status != models.TaskStatusDone {
		task.CompletedAt = nil
		return
	}
	if previous != models.TaskStatusDone {
		task.CompletedAt = &now
	}
}
func (s *TaskService) Create(req CreateTaskRequest, familyID, createdBy uuid.UUID) (*models.Task, error) {
	if req.Status == "" {
		req.Status = models.TaskStatusPending
	}
	task := &models.Task{FamilyID: familyID, CreatedBy: createdBy, AssignedTo: req.AssignedTo, Title: req.Title, Description: req.Description, Points: req.Points, Status: req.Status, DueDate: req.DueDate, IsRecurring: req.IsRecurring, RecurrenceRule: req.RecurrenceRule}
	if err := validTask(task); err != nil {
		return nil, err
	}
	if err := s.taskRepo.ValidateAssignee(familyID, task.AssignedTo); err != nil {
		return nil, err
	}
	taskCompletion(task, "", time.Now())
	if err := s.taskRepo.Create(task); err != nil {
		return nil, err
	}
	return task, nil
}
func (s *TaskService) GetTasks(req GetTasksRequest, familyID uuid.UUID) ([]models.Task, error) {
	opts := repositories.TaskQueryOpts{Status: models.TaskStatus(req.Status), DueDate: req.DueDate}
	if req.Status != "" && req.Status != "pending" && req.Status != "in_progress" && req.Status != "done" {
		return nil, errors.New("status tugas tidak valid")
	}
	if req.DueDate != "" && !validDate(req.DueDate) {
		return nil, errors.New("tanggal tenggat tidak valid")
	}
	if req.AssignedTo != "" {
		id, err := uuid.Parse(req.AssignedTo)
		if err != nil {
			return nil, errors.New("ID anggota tidak valid")
		}
		opts.AssignedTo = &id
	}
	return s.taskRepo.GetByFamily(familyID, opts)
}
func (s *TaskService) Update(id uuid.UUID, req UpdateTaskRequest, familyID uuid.UUID) (*models.Task, error) {
	return s.taskRepo.Mutate(id, familyID, func(repo *repositories.TaskRepository, task *models.Task) error {
		previous := task.Status
		if req.Title != nil {
			task.Title = *req.Title
		}
		if req.Description != nil {
			task.Description = *req.Description
		}
		if req.AssignedTo.Present {
			task.AssignedTo = req.AssignedTo.Value
		}
		if req.Points != nil {
			task.Points = *req.Points
		}
		if req.Status != nil {
			task.Status = *req.Status
		}
		if req.DueDate.Present {
			task.DueDate = req.DueDate.Value
		} else if task.DueDate != nil {
			date := strings.Split(*task.DueDate, "T")[0]
			task.DueDate = &date
		}
		if req.IsRecurring != nil {
			task.IsRecurring = *req.IsRecurring
		}
		if req.RecurrenceRule != nil {
			task.RecurrenceRule = *req.RecurrenceRule
		}
		if err := validTask(task); err != nil {
			return err
		}
		if err := repo.ValidateAssignee(familyID, task.AssignedTo); err != nil {
			return err
		}
		taskCompletion(task, previous, time.Now())
		return repo.Update(task)
	})
}

// Complete is idempotent and shares the same lock as ordinary status edits.
func (s *TaskService) Complete(id, familyID uuid.UUID) (*models.Task, error) {
	return s.taskRepo.Mutate(id, familyID, func(repo *repositories.TaskRepository, task *models.Task) error {
		if task.Status == models.TaskStatusDone {
			return nil
		}
		previous := task.Status
		task.Status = models.TaskStatusDone
		taskCompletion(task, previous, time.Now())
		return repo.Update(task)
	})
}
func (s *TaskService) Delete(id, familyID uuid.UUID) error {
	_, err := s.taskRepo.Mutate(id, familyID, func(repo *repositories.TaskRepository, task *models.Task) error {
		return repo.Delete(task.ID, familyID)
	})
	return err
}
func taskWeek(now time.Time) (time.Time, time.Time) {
	local := now.In(time.FixedZone("WIB", 7*3600))
	offset := (int(local.Weekday()) + 6) % 7
	monday := time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, local.Location()).AddDate(0, 0, -offset)
	return monday, monday.AddDate(0, 0, 7)
}
func (s *TaskService) GetLeaderboard(familyID uuid.UUID) ([]repositories.LeaderboardEntry, error) {
	start, end := taskWeek(time.Now())
	return s.taskRepo.GetLeaderboard(familyID, start, end)
}
