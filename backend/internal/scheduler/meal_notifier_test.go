package scheduler

import (
	"encoding/json"
	"keluarga-app/backend/internal/models"
	"strings"
	"testing"
)

func TestPayloadPreservesMultipleMealsAndJSON(t *testing.T) {
	meals := []models.MealPlan{
		{MealType: models.MealTypeLunch, Name: "Nasi"},
		{MealType: models.MealTypeLunch, Name: "Ayam \"kecap\"\nSayur"},
	}
	var payload map[string]string
	if err := json.Unmarshal([]byte(buildNotificationPayload(meals)), &payload); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(payload["body"], "Nasi, Ayam \"kecap\"\nSayur") || !strings.Contains(payload["body"], "Belum direncanakan") || payload["url"] != "/meals" {
		t.Fatalf("incomplete payload: %+v", payload)
	}
}
func TestInvalidLegacySubscriptionDoesNotPanic(t *testing.T) {
	(&MealNotifier{}).sendToSubscription(models.PushSubscription{Endpoint: "x"}, "{}")
}
