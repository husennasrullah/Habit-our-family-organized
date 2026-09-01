// Seed script — buat user dummy + keluarga + sample data untuk development.
//
// Cara pakai:
//   cd backend
//   go run cmd/seed/main.go
//
// Akun yang dibuat:
//   Admin  : admin@keluarga.dev  / password123
//   Member : member@keluarga.dev / password123
//
// Keluarga: "Keluarga Demo" (invite code: DEMO2024)

package main

import (
	"fmt"
	"log"
	"time"

	"keluarga-app/backend/internal/config"
	"keluarga-app/backend/internal/database"
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()
	database.ConnectPostgres(&cfg.DB)
	database.AutoMigrate()

	db := database.DB

	log.Println("🌱 Starting seed...")

	// ─── Bersihkan data lama (idempotent) ────────────────────────────────────
	cleanup(db)

	// ─── Buat keluarga ────────────────────────────────────────────────────────
	family := &models.Family{
		BaseModel:  models.BaseModel{ID: uuid.MustParse("00000000-0000-0000-0000-000000000001")},
		Name:       "Keluarga Demo",
		InviteCode: "DEMO2024",
	}
	if err := db.Create(family).Error; err != nil {
		log.Fatalf("gagal buat family: %v", err)
	}
	log.Printf("✅ Family: %s (invite: %s)", family.Name, family.InviteCode)

	// ─── Hash password ────────────────────────────────────────────────────────
	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	hashStr := string(hash)

	familyID := family.ID

	// ─── Admin user ───────────────────────────────────────────────────────────
	admin := &models.FamilyMember{
		BaseModel:    models.BaseModel{ID: uuid.MustParse("00000000-0000-0000-0000-000000000010")},
		FamilyID:     &familyID,
		Name:         "Ayah Demo",
		Email:        "admin@keluarga.dev",
		PasswordHash: hashStr,
		Role:         "admin",
		Color:        "sky",
		AuthProvider: "email",
	}
	if err := db.Create(admin).Error; err != nil {
		log.Fatalf("gagal buat admin: %v", err)
	}
	log.Printf("✅ Admin : %s / password123", admin.Email)

	// ─── Member user ──────────────────────────────────────────────────────────
	member := &models.FamilyMember{
		BaseModel:    models.BaseModel{ID: uuid.MustParse("00000000-0000-0000-0000-000000000011")},
		FamilyID:     &familyID,
		Name:         "Ibu Demo",
		Email:        "member@keluarga.dev",
		PasswordHash: hashStr,
		Role:         "member",
		Color:        "rose",
		AuthProvider: "email",
	}
	if err := db.Create(member).Error; err != nil {
		log.Fatalf("gagal buat member: %v", err)
	}
	log.Printf("✅ Member: %s / password123", member.Email)

	// ─── Sample events ────────────────────────────────────────────────────────
	now := time.Now()
	events := []models.Event{
		{
			FamilyID:    familyID,
			CreatedBy:   admin.ID,
			Title:       "Rapat Keluarga Mingguan",
			Description: "Diskusi rencana minggu ini",
			StartAt:     now.Format("2006-01-02") + "T09:00:00Z",
			EndAt:       now.Format("2006-01-02") + "T10:00:00Z",
			Type:        models.EventTypeGeneral,
			Color:       "sky",
		},
		{
			FamilyID:  familyID,
			CreatedBy: member.ID,
			Title:     "Ulang Tahun Ayah",
			StartAt:   now.AddDate(0, 0, 7).Format("2006-01-02") + "T00:00:00Z",
			EndAt:     now.AddDate(0, 0, 7).Format("2006-01-02") + "T23:59:00Z",
			IsAllDay:  true,
			Type:      models.EventTypeBirthday,
			Color:     "amber",
		},
		{
			FamilyID:  familyID,
			CreatedBy: admin.ID,
			Title:     "Kontrol Dokter",
			StartAt:   now.AddDate(0, 0, 3).Format("2006-01-02") + "T14:00:00Z",
			EndAt:     now.AddDate(0, 0, 3).Format("2006-01-02") + "T15:00:00Z",
			Type:      models.EventTypeMedical,
			Color:     "emerald",
		},
	}
	for _, e := range events {
		if err := db.Create(&e).Error; err != nil {
			log.Printf("⚠️  gagal buat event '%s': %v", e.Title, err)
		}
	}
	log.Printf("✅ Events: %d sample events", len(events))

	// ─── Sample tasks ─────────────────────────────────────────────────────────
	tomorrow := now.AddDate(0, 0, 1).Format("2006-01-02")
	tasks := []models.Task{
		{
			FamilyID:  familyID,
			CreatedBy: admin.ID,
			Title:     "Cuci piring",
			Points:    10,
			Status:    models.TaskStatusPending,
			DueDate:   &tomorrow,
		},
		{
			FamilyID:   familyID,
			CreatedBy:  admin.ID,
			AssignedTo: &member.ID,
			Title:      "Belanja bulanan",
			Points:     20,
			Status:     models.TaskStatusInProgress,
			DueDate:    &tomorrow,
		},
		{
			FamilyID:  familyID,
			CreatedBy: member.ID,
			Title:     "Bayar listrik",
			Points:    5,
			Status:    models.TaskStatusDone,
		},
	}
	for _, t := range tasks {
		if err := db.Create(&t).Error; err != nil {
			log.Printf("⚠️  gagal buat task '%s': %v", t.Title, err)
		}
	}
	log.Printf("✅ Tasks : %d sample tasks", len(tasks))

	// ─── Sample expenses ──────────────────────────────────────────────────────
	thisMonth := now.Format("2006-01")
	expenses := []models.Expense{
		{FamilyID: familyID, CreatedBy: admin.ID, Amount: 350000, Currency: "IDR", Category: "Makanan & Minuman", Description: "Belanja supermarket", Date: thisMonth + "-05"},
		{FamilyID: familyID, CreatedBy: member.ID, Amount: 150000, Currency: "IDR", Category: "Transportasi", Description: "BBM motor", Date: thisMonth + "-08"},
		{FamilyID: familyID, CreatedBy: admin.ID, Amount: 500000, Currency: "IDR", Category: "Tagihan & Utilitas", Description: "Listrik PLN", Date: thisMonth + "-10"},
		{FamilyID: familyID, CreatedBy: member.ID, Amount: 200000, Currency: "IDR", Category: "Kesehatan", Description: "Vitamin keluarga", Date: thisMonth + "-12"},
	}
	for _, e := range expenses {
		if err := db.Create(&e).Error; err != nil {
			log.Printf("⚠️  gagal buat expense: %v", err)
		}
	}
	log.Printf("✅ Expenses: %d sample expenses", len(expenses))

	// ─── Sample shopping items ────────────────────────────────────────────────
	items := []models.ShoppingItem{
		{FamilyID: familyID, AddedBy: admin.ID, Name: "Susu UHT", Quantity: "2", Unit: "liter"},
		{FamilyID: familyID, AddedBy: member.ID, Name: "Telur", Quantity: "1", Unit: "karpet"},
		{FamilyID: familyID, AddedBy: admin.ID, Name: "Sabun mandi", Quantity: "3", Unit: "buah"},
		{FamilyID: familyID, AddedBy: member.ID, Name: "Beras 5kg", Quantity: "1", Unit: "karung", IsChecked: true, CheckedBy: &admin.ID},
	}
	for _, i := range items {
		if err := db.Create(&i).Error; err != nil {
			log.Printf("⚠️  gagal buat shopping item: %v", err)
		}
	}
	log.Printf("✅ Shopping: %d items", len(items))

	// ─── Sample kid profile ───────────────────────────────────────────────────
	birthDate := now.AddDate(-5, -3, 0).Format("2006-01-02")
	kid := &models.KidProfile{
		FamilyID:  familyID,
		Name:      "Anak Demo",
		Gender:    "male",
		BirthDate: birthDate,
	}
	if err := db.Create(kid).Error; err != nil {
		log.Printf("⚠️  gagal buat kid: %v", err)
	} else {
		// Sample growth records
		growths := []models.GrowthRecord{
			{KidID: kid.ID, Date: now.AddDate(0, -6, 0).Format("2006-01-02"), HeightCm: ptr(105.0), WeightKg: ptr(17.5)},
			{KidID: kid.ID, Date: now.AddDate(0, -3, 0).Format("2006-01-02"), HeightCm: ptr(107.0), WeightKg: ptr(18.0)},
			{KidID: kid.ID, Date: now.Format("2006-01-02"), HeightCm: ptr(109.5), WeightKg: ptr(18.5)},
		}
		for _, g := range growths {
			db.Create(&g)
		}

		// Sample vaccines
		vaccines := []models.VaccineRecord{
			{KidID: kid.ID, VaccineName: "Campak MR", ScheduledDate: now.AddDate(0, -12, 0).Format("2006-01-02"), Status: models.VaccineStatusGiven},
			{KidID: kid.ID, VaccineName: "DPT Booster", ScheduledDate: now.AddDate(0, 1, 0).Format("2006-01-02"), Status: models.VaccineStatusScheduled},
			{KidID: kid.ID, VaccineName: "Influenza", ScheduledDate: now.AddDate(0, -2, 0).Format("2006-01-02"), Status: models.VaccineStatusOverdue},
		}
		for _, v := range vaccines {
			db.Create(&v)
		}

		log.Printf("✅ Kids  : %s (+ growth records + vaccines)", kid.Name)
	}

	// ─── Summary ──────────────────────────────────────────────────────────────
	fmt.Println()
	fmt.Println("═══════════════════════════════════════")
	fmt.Println("  Seed selesai! Gunakan akun berikut:")
	fmt.Println("═══════════════════════════════════════")
	fmt.Println()
	fmt.Println("  🔑 Admin")
	fmt.Println("     Email    : admin@keluarga.dev")
	fmt.Println("     Password : password123")
	fmt.Println("     Role     : admin")
	fmt.Println()
	fmt.Println("  👤 Member")
	fmt.Println("     Email    : member@keluarga.dev")
	fmt.Println("     Password : password123")
	fmt.Println("     Role     : member")
	fmt.Println()
	fmt.Println("  🏠 Keluarga : Keluarga Demo")
	fmt.Println("     Invite   : DEMO2024")
	fmt.Println()
	fmt.Printf("  Frontend : http://localhost:3000\n")
	fmt.Printf("  Backend  : http://localhost:8080\n")
	fmt.Println("═══════════════════════════════════════")
}

func cleanup(db *gorm.DB) {
	// Hapus dengan fixed ID agar idempotent (bisa dijalankan berulang)
	db.Exec("DELETE FROM vaccine_records WHERE kid_id IN (SELECT id FROM kid_profiles WHERE family_id = '00000000-0000-0000-0000-000000000001')")
	db.Exec("DELETE FROM growth_records  WHERE kid_id IN (SELECT id FROM kid_profiles WHERE family_id = '00000000-0000-0000-0000-000000000001')")
	db.Exec("DELETE FROM kid_profiles    WHERE family_id = '00000000-0000-0000-0000-000000000001'")
	db.Exec("DELETE FROM shopping_items  WHERE family_id = '00000000-0000-0000-0000-000000000001'")
	db.Exec("DELETE FROM expenses        WHERE family_id = '00000000-0000-0000-0000-000000000001'")
	db.Exec("DELETE FROM tasks           WHERE family_id = '00000000-0000-0000-0000-000000000001'")
	db.Exec("DELETE FROM events          WHERE family_id = '00000000-0000-0000-0000-000000000001'")
	db.Exec("DELETE FROM family_members  WHERE family_id = '00000000-0000-0000-0000-000000000001'")
	db.Exec("DELETE FROM families        WHERE id        = '00000000-0000-0000-0000-000000000001'")
}

func ptr[T any](v T) *T { return &v }
