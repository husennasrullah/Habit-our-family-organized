package handlers

import (
	"github.com/gofiber/fiber/v2"
	"net/http/httptest"
	"testing"
)

func TestVAPIDRequiresBothKeys(t *testing.T) {
	for _, keys := range [][2]string{{"", ""}, {"public", ""}, {"", "private"}, {"public", "private"}} {
		app := fiber.New()
		app.Get("/push/vapid-key", GetVAPIDPublicKey(keys[0], keys[1]))
		resp, err := app.Test(httptest.NewRequest("GET", "/push/vapid-key", nil))
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		expected := 503
		if keys[0] != "" && keys[1] != "" {
			expected = 200
		}
		if resp.StatusCode != expected {
			t.Fatalf("got %d expected %d", resp.StatusCode, expected)
		}
	}
}
