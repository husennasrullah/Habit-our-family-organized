package handlers

import (
	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type TaskHandler struct {
	taskService *services.TaskService
}

func NewTaskHandler(taskService *services.TaskService) *TaskHandler {
	return &TaskHandler{taskService: taskService}
}

// GetTasks godoc
// @Summary Ambil daftar tasks
// @Tags tasks
// @Security BearerAuth
// @Produce json
// @Param assigned_to query string false "UUID anggota"
// @Param status      query string false "pending|in_progress|done"
// @Param due_date    query string false "Tanggal (YYYY-MM-DD)"
// @Success 200 {object} map[string]interface{}
// @Router /tasks [get]
func (h *TaskHandler) GetTasks(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "kamu belum bergabung ke keluarga manapun",
		})
	}

	req := services.GetTasksRequest{
		AssignedTo: c.Query("assigned_to"),
		Status:     c.Query("status"),
		DueDate:    c.Query("due_date"),
	}

	tasks, err := h.taskService.GetTasks(req, familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "gagal mengambil data task",
		})
	}

	return c.JSON(fiber.Map{"data": tasks, "message": "success"})
}

// CreateTask godoc
// @Summary Buat task baru
// @Tags tasks
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param body body services.CreateTaskRequest true "Create task payload"
// @Success 201 {object} map[string]interface{}
// @Router /tasks [post]
func (h *TaskHandler) CreateTask(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	userID := getUserID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "kamu belum bergabung ke keluarga manapun",
		})
	}

	var req services.CreateTaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	task, err := h.taskService.Create(req, familyID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data":    task,
		"message": "task berhasil dibuat",
	})
}

// UpdateTask godoc
// @Summary Update task
// @Tags tasks
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Task ID"
// @Success 200 {object} map[string]interface{}
// @Router /tasks/{id} [put]
func (h *TaskHandler) UpdateTask(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}

	familyID := getFamilyID(c)
	var req services.UpdateTaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	task, err := h.taskService.Update(id, req, familyID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"data": task, "message": "task berhasil diperbarui"})
}

// CompleteTask godoc
// @Summary Tandai task selesai
// @Tags tasks
// @Security BearerAuth
// @Param id path string true "Task ID"
// @Success 200 {object} map[string]interface{}
// @Router /tasks/{id}/complete [patch]
func (h *TaskHandler) CompleteTask(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}

	familyID := getFamilyID(c)
	task, err := h.taskService.Complete(id, familyID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"data": task, "message": "task selesai"})
}

// DeleteTask godoc
// @Summary Hapus task
// @Tags tasks
// @Security BearerAuth
// @Param id path string true "Task ID"
// @Success 200 {object} map[string]string
// @Router /tasks/{id} [delete]
func (h *TaskHandler) DeleteTask(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID tidak valid"})
	}

	familyID := getFamilyID(c)
	if err := h.taskService.Delete(id, familyID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "task berhasil dihapus"})
}

// GetLeaderboard godoc
// @Summary Leaderboard poin mingguan keluarga
// @Tags tasks
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /tasks/leaderboard [get]
func (h *TaskHandler) GetLeaderboard(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "kamu belum bergabung ke keluarga manapun",
		})
	}

	entries, err := h.taskService.GetLeaderboard(familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "gagal mengambil leaderboard",
		})
	}

	return c.JSON(fiber.Map{"data": entries, "message": "success"})
}
