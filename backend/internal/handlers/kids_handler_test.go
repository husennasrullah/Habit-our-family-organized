package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"keluarga-app/backend/internal/middleware"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestKidsRoutesRequireAdultAndValidateNestedPaths(t *testing.T) {
	h := NewKidsHandler(nil)
	for _, role := range []string{"admin", "member", "child", "view_only"} {
		app := fiber.New()
		group := app.Group("/kids", func(c *fiber.Ctx) error { c.Locals("role", role); c.Locals("family_id", uuid.New()); return c.Next() }, middleware.RequireRole("admin", "member"))
		group.Patch("/:id/vaccines/:vaccine_id/given", h.MarkVaccineGiven)
		group.Patch("/:id/milestones/:milestone_id/achievement", h.SetMilestoneAchievement)
		group.Put("/:id/growth/:record_id", h.UpdateGrowth)
		for _, endpoint := range []struct{ method, path string }{{"PATCH", "/kids/not-a-uuid/vaccines/11111111-1111-4111-8111-111111111111/given"}, {"PATCH", "/kids/11111111-1111-4111-8111-111111111111/milestones/not-a-uuid/achievement"}, {"PUT", "/kids/11111111-1111-4111-8111-111111111111/growth/not-a-uuid"}} {
			req := httptest.NewRequest(endpoint.method, endpoint.path, strings.NewReader("{}"))
			req.Header.Set("Content-Type", "application/json")
			resp, err := app.Test(req)
			if err != nil {
				t.Fatal(err)
			}
			resp.Body.Close()
			expected := 400
			if role == "child" || role == "view_only" {
				expected = 403
			}
			if resp.StatusCode != expected {
				t.Fatalf("role %s %s got %d want %d", role, endpoint.path, resp.StatusCode, expected)
			}
		}
	}
}

func TestAchievementRequiresExplicitState(t *testing.T) {
	app := fiber.New()
	h := NewKidsHandler(nil)
	app.Patch("/kids/:id/milestones/:milestone_id/achievement", h.SetMilestoneAchievement)
	for _, body := range []string{`{}`, `{"achieved":null}`, `{"achieved":"yes"}`} {
		req := httptest.NewRequest("PATCH", "/kids/11111111-1111-4111-8111-111111111111/milestones/22222222-2222-4222-8222-222222222222/achievement", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		resp, err := app.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if resp.StatusCode != 400 {
			t.Fatalf("accepted %s: %d", body, resp.StatusCode)
		}
	}
}
