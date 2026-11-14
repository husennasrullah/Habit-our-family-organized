package database

import (
	"keluarga-app/backend/internal/models"
	"log"
	"time"
)

// AutoMigrate menjalankan migrasi semua model GORM
func AutoMigrate() {
	hadPushSession := DB.Migrator().HasColumn(&models.PushSubscription{}, "session_id")
	hadCompletedAt := DB.Migrator().HasColumn(&models.Task{}, "completed_at")
	if err := DB.AutoMigrate(
		&models.Family{},
		&models.FamilyMember{},
		&models.AuthSession{},
		&models.Event{},
		&models.Task{},
		&models.Expense{},
		&models.Budget{},
		&models.ShoppingItem{},
		&models.Memory{},
		&models.MemoryPhoto{},
		&models.KidProfile{},
		&models.GrowthRecord{},
		&models.VaccineRecord{},
		&models.Milestone{},
		&models.HealthRecord{},
		&models.Document{},
		&models.MealPlan{},
		&models.PushSubscription{},
		&models.FinancialGoal{},
		&models.FinancialGoalEntry{},
		&models.Trip{},
		&models.TripMember{},
		&models.TripItinerary{},
		&models.TripItineraryBudget{},
		&models.TripPackingItem{},
		&models.TripExpense{},
		&models.TripExpenseSplit{},
		&models.TripDocument{},
	); err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}
	if !hadPushSession {
		if err := DB.Model(&models.PushSubscription{}).Where("session_id IS NULL").Update("deleted_at", time.Now()).Error; err != nil {
			log.Fatal("Push session migration failed")
		}
	}
	if !hadCompletedAt {
		// Legacy tasks have no completion timestamp; preserve the best historical estimate once.
		if err := DB.Exec("UPDATE tasks SET completed_at = updated_at WHERE status = 'done' AND completed_at IS NULL").Error; err != nil {
			log.Fatalf("Task completion backfill failed: %v", err)
		}
	}
	if err := DB.Model(&models.Family{}).Where("invite_expires_at IS NULL").Update("invite_expires_at", time.Now().Add(7*24*time.Hour)).Error; err != nil {
		log.Fatal("Invite expiry backfill failed")
	}
	log.Println("Database migration completed")
}
