package services

import (
	"github.com/google/uuid"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	"strings"
	"sync"
	"testing"
)

func TestMealValidation(t *testing.T) {
	valid := models.MealPlan{Name: "  Sayur  ", Date: "2028-02-29", MealType: models.MealTypeLunch, Notes: "  4 porsi ", RecipeURL: " https://example.test/resep "}
	if err := validateMeal(&valid); err != nil || valid.Name != "Sayur" || valid.Notes != "4 porsi" || valid.RecipeURL != "https://example.test/resep" {
		t.Fatal(valid, err)
	}
	for _, mutate := range []func(*models.MealPlan){
		func(m *models.MealPlan) { m.Name = "  " }, func(m *models.MealPlan) { m.Name = strings.Repeat("a", 151) },
		func(m *models.MealPlan) { m.Date = "2026-02-30" }, func(m *models.MealPlan) { m.Date = "2026-1-01" }, func(m *models.MealPlan) { m.Date = "0000-01-01" },
		func(m *models.MealPlan) { m.MealType = "snack" }, func(m *models.MealPlan) { m.RecipeURL = "javascript:alert(1)" }, func(m *models.MealPlan) { m.RecipeURL = "https://user:pass@example.test" }, func(m *models.MealPlan) { m.Notes = strings.Repeat("x", 2001) },
	} {
		m := valid
		mutate(&m)
		if validateMeal(&m) == nil {
			t.Fatalf("invalid meal accepted: %+v", m)
		}
	}
	svc := NewMealPlanService(nil)
	for _, req := range []GetMealPlansRequest{{From: "2026-02-30", To: "2026-03-01"}, {From: "2026-11-14", To: "2026-11-13"}} {
		if _, err := svc.GetByDateRange(req, uuid.New()); err == nil {
			t.Fatal("invalid range accepted")
		}
	}
}

func TestMealCRUDAndPushOwnership(t *testing.T) {
	db := financeDB(t)
	if err := db.AutoMigrate(&models.MealPlan{}, &models.PushSubscription{}, &models.AuthSession{}); err != nil {
		t.Fatal(err)
	}
	family, other, actor, stranger := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	svc := NewMealPlanService(repositories.NewMealPlanRepository(db))
	meal, err := svc.Create(CreateMealPlanRequest{Name: " Nasi ", Date: "2026-11-13", MealType: models.MealTypeLunch, Notes: "test", RecipeURL: "https://example.test"}, family, actor)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = svc.Update(meal.ID, UpdateMealPlanRequest{Name: "Foreign"}, other); err == nil {
		t.Fatal("foreign edit accepted")
	}
	if err = svc.Delete(meal.ID, other); err != nil {
		t.Fatal(err)
	}
	date, mealType := "2026-11-14", models.MealTypeDinner
	updated, err := svc.Update(meal.ID, UpdateMealPlanRequest{Name: " Ayam ", Date: &date, MealType: &mealType}, family)
	if err != nil || updated.Name != "Ayam" || updated.Notes != "" || updated.RecipeURL != "" {
		t.Fatal(updated, err)
	}
	list, err := svc.GetByDateRange(GetMealPlansRequest{From: date, To: date}, family)
	if err != nil || len(list) != 1 || list[0].MealType != mealType {
		t.Fatal(list, err)
	}
	if err = svc.Delete(meal.ID, family); err != nil {
		t.Fatal(err)
	}
	if err = repositories.NewMealPlanRepository(db).Update(updated); err == nil {
		t.Fatal("stale update accepted after delete")
	}
	if _, err = svc.Update(meal.ID, UpdateMealPlanRequest{Name: "Revive"}, family); err == nil {
		t.Fatal("deleted meal resurrected")
	}
	repo := repositories.NewPushSubscriptionRepository(db)
	sub := &models.PushSubscription{FamilyID: family, MemberID: actor, Endpoint: "https://fcm.googleapis.com/test", P256DH: "key", Auth: "auth"}
	if err = repo.Upsert(sub); err != nil {
		t.Fatal(err)
	}
	var wg sync.WaitGroup
	failures := make(chan error, 10)
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			failures <- repo.Upsert(&models.PushSubscription{FamilyID: family, MemberID: actor, Endpoint: sub.Endpoint, P256DH: "key", Auth: "auth"})
		}()
	}
	wg.Wait()
	close(failures)
	for err := range failures {
		if err != nil {
			t.Fatal(err)
		}
	}
	foreign := &models.PushSubscription{FamilyID: other, MemberID: stranger, Endpoint: sub.Endpoint, P256DH: "foreign", Auth: "foreign"}
	if err = repo.Upsert(foreign); err == nil {
		t.Fatal("subscription ownership transferred")
	}
	if err = repo.DeleteByEndpoint(sub.Endpoint, other, stranger); err != nil {
		t.Fatal(err)
	}
	if err = repo.DeleteByEndpoint(sub.Endpoint, family, stranger); err != nil {
		t.Fatal(err)
	}
	exists, err := repo.IsSubscribed(sub.Endpoint, family, actor)
	if err != nil || !exists {
		t.Fatal("foreign delete affected owner", err)
	}
	sub.P256DH = "new-key"
	if err = repo.Upsert(sub); err != nil {
		t.Fatal(err)
	}
	subs, err := repo.GetByFamily(family)
	if err != nil || len(subs) != 1 || subs[0].P256DH != "new-key" {
		t.Fatal(subs, err)
	}
	if err = repo.DeleteByEndpoint(sub.Endpoint, family, actor); err != nil {
		t.Fatal(err)
	}
	exists, err = repo.IsSubscribed(sub.Endpoint, family, actor)
	if err != nil || exists {
		t.Fatal("unsubscribe failed", err)
	}
	if err = repo.Upsert(sub); err != nil {
		t.Fatal("resubscribe failed", err)
	}
}
