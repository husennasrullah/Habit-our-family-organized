package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TaskRepository struct {
	db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) *TaskRepository {
	return &TaskRepository{db: db}
}

func (r *TaskRepository) Create(t *models.Task) error {
	return r.db.Create(t).Error
}

func (r *TaskRepository) GetByID(id, familyID uuid.UUID) (*models.Task, error) {
	var t models.Task
	err := r.db.First(&t, "id = ? AND family_id = ?", id, familyID).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// GetByFamily — list tasks dengan filter opsional
func (r *TaskRepository) GetByFamily(familyID uuid.UUID, opts TaskQueryOpts) ([]models.Task, error) {
	var tasks []models.Task
	q := r.db.Where("family_id = ?", familyID)

	if opts.AssignedTo != nil {
		q = q.Where("assigned_to = ?", *opts.AssignedTo)
	}
	if opts.Status != "" {
		q = q.Where("status = ?", opts.Status)
	}
	if opts.DueDate != "" {
		q = q.Where("due_date = ?", opts.DueDate)
	}

	err := q.Order("due_date ASC NULLS LAST, created_at DESC").Find(&tasks).Error
	return tasks, err
}

func (r *TaskRepository) Update(t *models.Task) error {
	return r.db.Save(t).Error
}

func (r *TaskRepository) Delete(id, familyID uuid.UUID) error {
	return r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.Task{}).Error
}

// GetLeaderboard — total poin per assigned_to dalam family untuk minggu ini
func (r *TaskRepository) GetLeaderboard(familyID uuid.UUID, since string) ([]LeaderboardEntry, error) {
	var rows []LeaderboardEntry
	err := r.db.Raw(`
		SELECT assigned_to AS member_id, SUM(points) AS total_points, COUNT(*) AS tasks_done
		FROM tasks
		WHERE family_id = ?
		  AND status = 'done'
		  AND assigned_to IS NOT NULL
		  AND updated_at >= ?
		  AND deleted_at IS NULL
		GROUP BY assigned_to
		ORDER BY total_points DESC
	`, familyID, since).Scan(&rows).Error
	return rows, err
}

// ─── Supporting types ─────────────────────────────────────────────────────────

type TaskQueryOpts struct {
	AssignedTo *uuid.UUID
	Status     models.TaskStatus
	DueDate    string
}

type LeaderboardEntry struct {
	MemberID    uuid.UUID `json:"member_id"`
	TotalPoints int       `json:"total_points"`
	TasksDone   int       `json:"tasks_done"`
}
