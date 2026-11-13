package database

import (
	"keluarga-app/backend/internal/models"
	"log"
)

// AutoMigrate menjalankan migrasi semua model GORM
func AutoMigrate() {
	hadCompletedAt := DB.Migrator().HasColumn(&models.Task{}, "completed_at")
	if err := DB.AutoMigrate(
		&models.Family{},
		&models.FamilyMember{},
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
	if !hadCompletedAt {
		// Legacy tasks have no completion timestamp; preserve the best historical estimate once.
		if err := DB.Exec("UPDATE tasks SET completed_at = updated_at WHERE status = 'done' AND completed_at IS NULL").Error; err != nil {
			log.Fatalf("Task completion backfill failed: %v", err)
		}
	}
	log.Println("Database migration completed")
}
