package services

import (
	"encoding/json"
	"github.com/google/uuid"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	"os"
	"sync"
	"testing"
	"time"
)

func TestTaskUpdatePresence(t *testing.T) {
	for _, tc := range []struct {
		body     string
		present  bool
		nilValue bool
	}{
		{`{}`, false, true}, {`{"assigned_to":null,"due_date":null}`, true, true},
		{`{"assigned_to":"11111111-1111-4111-8111-111111111111","due_date":"2026-11-13"}`, true, false},
	} {
		var req UpdateTaskRequest
		if err := json.Unmarshal([]byte(tc.body), &req); err != nil {
			t.Fatal(err)
		}
		if req.AssignedTo.Present != tc.present || req.DueDate.Present != tc.present || (req.AssignedTo.Value == nil) != tc.nilValue || (req.DueDate.Value == nil) != tc.nilValue {
			t.Fatalf("presence lost: %s", tc.body)
		}
	}
}
func TestTaskValidationAndCompletion(t *testing.T) {
	for _, task := range []models.Task{{Title: "   ", Status: "pending"}, {Title: "A", Status: "bad"}, {Title: "A", Status: "done", Points: -1}, {Title: "A", Status: "done", Points: 1001}} {
		if validTask(&task) == nil {
			t.Fatalf("accepted invalid task %+v", task)
		}
	}
	invalid := "2026-02-30"
	task := models.Task{Title: "  Tugas  ", Status: "pending", DueDate: &invalid}
	if validTask(&task) == nil {
		t.Fatal("accepted invalid date")
	}
	task.DueDate = nil
	if err := validTask(&task); err != nil || task.Title != "Tugas" {
		t.Fatal("title not normalized")
	}
	now := time.Now()
	task.Status = "done"
	taskCompletion(&task, "pending", now)
	if task.CompletedAt == nil || !task.CompletedAt.Equal(now) {
		t.Fatal("completion not recorded")
	}
	taskCompletion(&task, "done", now.Add(time.Hour))
	if !task.CompletedAt.Equal(now) {
		t.Fatal("metadata edit moved completion")
	}
	task.Status = "in_progress"
	taskCompletion(&task, "done", now)
	if task.CompletedAt != nil {
		t.Fatal("reopened task still completed")
	}
	monday, end := taskWeek(time.Date(2026, 11, 15, 17, 30, 0, 0, time.UTC))
	if monday.Format(time.RFC3339) != "2026-11-16T00:00:00+07:00" || end.Sub(monday) != 7*24*time.Hour {
		t.Fatalf("wrong WIB week: %v %v", monday, end)
	}
}
func TestTaskPersistenceIsolationAndLeaderboard(t *testing.T) {
	db := financeDB(t)
	if err := db.Exec("ALTER TABLE family_members ADD COLUMN deleted_at timestamptz").Error; err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.Task{}); err != nil {
		t.Fatal(err)
	}
	family, other, actor, stranger := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	if err := db.Exec("INSERT INTO family_members(id,family_id,name) VALUES (?,?,?),(?,?,?)", actor, family, "Nadia", stranger, other, "Other").Error; err != nil {
		t.Fatal(err)
	}
	svc := NewTaskService(repositories.NewTaskRepository(db))
	date := "2026-11-13"
	task, err := svc.Create(CreateTaskRequest{Title: "Tugas", Points: 10, AssignedTo: &actor, DueDate: &date}, family, actor)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Create(CreateTaskRequest{Title: "Foreign", AssignedTo: &stranger}, family, actor); err == nil {
		t.Fatal("foreign assignee accepted")
	}
	if _, err := svc.Update(task.ID, UpdateTaskRequest{AssignedTo: TaskField[uuid.UUID]{Present: true, Value: &stranger}}, family); err == nil {
		t.Fatal("foreign assignee update accepted")
	}
	if _, err := svc.Complete(task.ID, other); err == nil {
		t.Fatal("foreign completion accepted")
	}
	if err := svc.Delete(task.ID, other); err == nil {
		t.Fatal("foreign deletion accepted")
	}
	var clear UpdateTaskRequest
	if err := json.Unmarshal([]byte(`{"assigned_to":null,"due_date":null}`), &clear); err != nil {
		t.Fatal(err)
	}
	task, err = svc.Update(task.ID, clear, family)
	if err != nil || task.AssignedTo != nil || task.DueDate != nil {
		t.Fatalf("null clear failed: %+v %v", task, err)
	}
	if _, err = svc.Update(task.ID, UpdateTaskRequest{AssignedTo: TaskField[uuid.UUID]{Present: true, Value: &actor}}, family); err != nil {
		t.Fatal(err)
	}
	var wg sync.WaitGroup
	failures := make(chan error, 10)
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, e := svc.Complete(task.ID, family)
			if e != nil {
				failures <- e
			}
		}()
	}
	wg.Wait()
	close(failures)
	for err := range failures {
		t.Fatal(err)
	}
	rows, err := svc.GetLeaderboard(family)
	if err != nil || len(rows) != 1 || rows[0].TasksDone != 1 || rows[0].TotalPoints != 10 {
		t.Fatalf("duplicated completion: %+v %v", rows, err)
	}
	old := time.Now().AddDate(0, 0, -14)
	if err := db.Model(&models.Task{}).Where("id = ? AND family_id = ?", task.ID, family).Update("completed_at", old).Error; err != nil {
		t.Fatal(err)
	}
	title := "Metadata edit"
	task, err = svc.Update(task.ID, UpdateTaskRequest{Title: &title}, family)
	if err != nil {
		t.Fatal(err)
	}
	rows, err = svc.GetLeaderboard(family)
	if err != nil || len(rows) != 0 {
		t.Fatalf("old task moved into current week: %+v %v", rows, err)
	}
	status := models.TaskStatusInProgress
	task, err = svc.Update(task.ID, UpdateTaskRequest{Status: &status}, family)
	if err != nil || task.CompletedAt != nil {
		t.Fatal("reopen failed")
	}
	if _, err = svc.Complete(task.ID, family); err != nil {
		t.Fatal(err)
	}
	if err = svc.Delete(task.ID, family); err != nil {
		t.Fatal(err)
	}
	rows, err = svc.GetLeaderboard(family)
	if err != nil || len(rows) != 0 {
		t.Fatal("deleted task still counted")
	}
	legacy, err := svc.Create(CreateTaskRequest{Title: "Legacy", Status: models.TaskStatusDone, AssignedTo: &actor}, family, actor)
	if err != nil {
		t.Fatal(err)
	}
	if err := db.Model(&models.Task{}).Where("id = ? AND family_id = ?", legacy.ID, family).UpdateColumns(map[string]interface{}{"completed_at": nil, "updated_at": old}).Error; err != nil {
		t.Fatal(err)
	}
	migration, err := os.ReadFile("../../migrations/012_task_completion.sql")
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 2; i++ {
		if err := db.Exec(string(migration)).Error; err != nil {
			t.Fatal(err)
		}
	}
	migrated, err := repositories.NewTaskRepository(db).GetByID(legacy.ID, family)
	if err != nil || migrated.CompletedAt == nil || migrated.CompletedAt.Sub(old).Abs() > time.Millisecond {
		t.Fatalf("legacy completion backfill failed: %+v %v", migrated, err)
	}
}
