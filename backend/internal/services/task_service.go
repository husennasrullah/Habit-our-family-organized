package services

import (
	"errors"
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
	Title          *string            `json:"title"`
	Description    *string            `json:"description"`
	AssignedTo     *uuid.UUID         `json:"assigned_to"`
	Points         *int               `json:"points"`
	Status         *models.TaskStatus `json:"status"`
	DueDate        *string            `json:"due_date"`
	IsRecurring    *bool              `json:"is_recurring"`
	RecurrenceRule *string            `json:"recurrence_rule"`
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

func (s *TaskService) Create(req CreateTaskRequest, familyID, createdBy uuid.UUID) (*models.Task, error) {
	if req.Title == "" {
		return nil, errors.New("judul task wajib diisi")
	}

	status := req.Status
	if status == "" {
		status = models.TaskStatusPending
	}

	task := &models.Task{
		FamilyID:       familyID,
		CreatedBy:      createdBy,
		AssignedTo:     req.AssignedTo,
		Title:          req.Title,
		Description:    req.Description,
		Points:         req.Points,
		Status:         status,
		DueDate:        req.DueDate,
		IsRecurring:    req.IsRecurring,
		RecurrenceRule: req.RecurrenceRule,
	}

	if err := s.taskRepo.Create(task); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *TaskService) GetTasks(req GetTasksRequest, familyID uuid.UUID) ([]models.Task, error) {
	opts := repositories.TaskQueryOpts{
		Status:  models.TaskStatus(req.Status),
		DueDate: req.DueDate,
	}

	if req.AssignedTo != "" {
		id, err := uuid.Parse(req.AssignedTo)
		if err == nil {
			opts.AssignedTo = &id
		}
	}

	return s.taskRepo.GetByFamily(familyID, opts)
}

func (s *TaskService) Update(id uuid.UUID, req UpdateTaskRequest, familyID uuid.UUID) (*models.Task, error) {
	task, err := s.taskRepo.GetByID(id, familyID)
	if err != nil {
		return nil, errors.New("task tidak ditemukan")
	}

	if req.Title != nil {
		task.Title = *req.Title
	}
	if req.Description != nil {
		task.Description = *req.Description
	}
	if req.AssignedTo != nil {
		task.AssignedTo = req.AssignedTo
	}
	if req.Points != nil {
		task.Points = *req.Points
	}
	if req.Status != nil {
		task.Status = *req.Status
	}
	if req.DueDate != nil {
		task.DueDate = req.DueDate
	}
	if req.IsRecurring != nil {
		task.IsRecurring = *req.IsRecurring
	}
	if req.RecurrenceRule != nil {
		task.RecurrenceRule = *req.RecurrenceRule
	}

	if err := s.taskRepo.Update(task); err != nil {
		return nil, err
	}
	return task, nil
}

// Complete — set status done + tambah poin ke assigned member
func (s *TaskService) Complete(id, familyID uuid.UUID) (*models.Task, error) {
	task, err := s.taskRepo.GetByID(id, familyID)
	if err != nil {
		return nil, errors.New("task tidak ditemukan")
	}
	if task.Status == models.TaskStatusDone {
		return nil, errors.New("task sudah selesai")
	}

	task.Status = models.TaskStatusDone

	if err := s.taskRepo.Update(task); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *TaskService) Delete(id, familyID uuid.UUID) error {
	_, err := s.taskRepo.GetByID(id, familyID)
	if err != nil {
		return errors.New("task tidak ditemukan")
	}
	return s.taskRepo.Delete(id, familyID)
}

// GetLeaderboard — poin mingguan anggota keluarga
func (s *TaskService) GetLeaderboard(familyID uuid.UUID) ([]repositories.LeaderboardEntry, error) {
	// Hitung sejak Senin minggu ini
	now := time.Now()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	monday := now.AddDate(0, 0, -(weekday - 1))
	since := monday.Format("2006-01-02")
	return s.taskRepo.GetLeaderboard(familyID, since)
}
