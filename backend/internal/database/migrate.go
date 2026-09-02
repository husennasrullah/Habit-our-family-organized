package database

import (
	"keluarga-app/backend/internal/models"
	"log"
)

// AutoMigrate menjalankan migrasi semua model GORM
func AutoMigrate() {
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
	); err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}
	log.Println("Database migration completed")
}
