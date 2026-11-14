package handlers

import (
	"github.com/gofiber/fiber/v2"
	"keluarga-app/backend/internal/middleware"
	"net/http/httptest"
	"testing"
)

func TestDocumentRoles(t *testing.T) {
	for _, role := range []string{"child", "view_only", "member", "admin"} {
		app := fiber.New()
		app.Use(func(c *fiber.Ctx) error { c.Locals("role", role); return c.Next() })
		g := app.Group("/documents", middleware.RequireRole("admin", "member"))
		for _, method := range []string{"GET", "POST", "PUT", "DELETE"} {
			g.Add(method, "", func(c *fiber.Ctx) error { return c.SendStatus(204) })
		}
		for _, method := range []string{"GET", "POST", "PUT", "DELETE"} {
			r, err := app.Test(httptest.NewRequest(method, "/documents", nil))
			if err != nil {
				t.Fatal(err)
			}
			want := 204
			if role == "child" || role == "view_only" {
				want = 403
			}
			if r.StatusCode != want {
				t.Errorf("%s %s got %d", role, method, r.StatusCode)
			}
			r.Body.Close()
		}
	}
}
