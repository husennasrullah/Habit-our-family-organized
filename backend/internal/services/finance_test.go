package services

import (
	"math"
	"net/url"
	"os"
	"strings"
	"sync"
	"testing"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
)

func TestFinanceValidation(t *testing.T) {
	for _, n := range []float64{-1, 0, math.NaN(), math.Inf(1), 1.001, 1e14} {
		if validMoney(n, false) {
			t.Errorf("accepted invalid amount %v", n)
		}
	}
	for _, n := range []float64{0.01, 100, 1234567.89} {
		if !validMoney(n, false) {
			t.Errorf("rejected amount %v", n)
		}
	}
	if !validMoney(0, true) {
		t.Fatal("opening zero must be allowed")
	}
	for _, s := range []string{"2026-02-30", "2026-13-01", "", "2026-1-1"} {
		if validDate(s) {
			t.Errorf("accepted date %s", s)
		}
	}
	if !validDate("2028-02-29") {
		t.Fatal("leap day rejected")
	}
	svc := NewBudgetService(nil, nil, nil)
	amount := -10.0
	if _, err := svc.UpdateExpense(uuid.New(), UpdateExpenseRequest{Amount: &amount}, uuid.New()); err == nil {
		t.Fatal("negative expense update accepted")
	}
	if _, err := svc.UpsertBudget(UpsertBudgetRequest{Category: "Food", Amount: 100, Month: 13, Year: 2026}, uuid.New()); err == nil {
		t.Fatal("invalid period accepted")
	}
}

func financeDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := os.Getenv("HABIT_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set HABIT_TEST_DATABASE_URL for isolated PostgreSQL integration tests")
	}
	admin, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	schema := "habit_finance_test_" + strings.ReplaceAll(uuid.NewString(), "-", "")
	if err := admin.Exec("CREATE SCHEMA " + schema).Error; err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { admin.Exec("DROP SCHEMA " + schema + " CASCADE"); sql, _ := admin.DB(); sql.Close() })
	if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
		u, _ := url.Parse(dsn)
		q := u.Query()
		q.Set("search_path", schema)
		u.RawQuery = q.Encode()
		dsn = u.String()
	} else {
		dsn += " search_path=" + schema
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { sql, _ := db.DB(); sql.Close() })
	if err := db.AutoMigrate(&models.FinancialGoal{}, &models.FinancialGoalEntry{}, &models.Expense{}, &models.Budget{}, &models.ShoppingItem{}); err != nil {
		t.Fatal(err)
	}
	if err := db.Exec("CREATE TABLE family_members (id uuid PRIMARY KEY, family_id uuid, name text)").Error; err != nil {
		t.Fatal(err)
	}
	return db
}

func TestFinanceConcurrentDepositsAndLedger(t *testing.T) {
	db := financeDB(t)
	family, actor := uuid.New(), uuid.New()
	db.Exec("INSERT INTO family_members VALUES (?,?,?)", actor, family, "Ayah")
	svc := NewFinancialGoalService(repositories.NewFinancialGoalRepository(db))
	g, err := svc.Create(CreateGoalRequest{Title: "Dana darurat", TargetAmount: 100, CurrentAmount: 10}, family, actor)
	if err != nil {
		t.Fatal(err)
	}
	var wg sync.WaitGroup
	fail := make(chan error, 20)
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := svc.AddFund(g.ID, AddFundRequest{Amount: 5}, family, actor)
			if err != nil {
				fail <- err
			}
		}()
	}
	wg.Wait()
	close(fail)
	for err := range fail {
		t.Fatal(err)
	}
	fresh, _ := svc.GetList(family)
	if len(fresh) != 1 || fresh[0].CurrentAmount != 110 || !fresh[0].IsAchieved {
		t.Fatalf("lost deposit or achievement: %+v", fresh)
	}
	entries, err := svc.Entries(g.ID, family)
	if err != nil || len(entries) != 21 {
		t.Fatalf("ledger: len=%d err=%v", len(entries), err)
	}
	sum := 0.0
	for _, e := range entries {
		sum += e.Amount
		if e.ActorName != "Ayah" {
			t.Fatalf("missing actor: %+v", e)
		}
	}
	if sum != 110 {
		t.Fatal(sum)
	}
	target := 200.0
	freshGoal, err := svc.Update(g.ID, UpdateGoalRequest{TargetAmount: &target}, family, actor)
	if err != nil || freshGoal.IsAchieved || freshGoal.CurrentAmount != 110 {
		t.Fatalf("target increase must reopen without overwriting balance: %+v %v", freshGoal, err)
	}
	balance := 50.0
	_, err = svc.Update(g.ID, UpdateGoalRequest{CurrentAmount: &balance}, family, actor)
	if err != nil {
		t.Fatal(err)
	}
	entries, _ = svc.Entries(g.ID, family)
	sum = 0
	for _, e := range entries {
		sum += e.Amount
	}
	if sum != 50 || len(entries) != 22 {
		t.Fatal("correction missing from ledger")
	}
	if _, err := svc.AddFund(g.ID, AddFundRequest{Amount: 1}, uuid.New(), actor); err == nil {
		t.Fatal("cross family deposit allowed")
	}
	if _, err := svc.Entries(g.ID, uuid.New()); err == nil {
		t.Fatal("cross family history allowed")
	}
	legacy := models.FinancialGoal{FamilyID: family, CreatedBy: actor, Title: "Legacy", TargetAmount: 100, CurrentAmount: 30}
	db.Create(&legacy)
	if _, err := svc.AddFund(legacy.ID, AddFundRequest{Amount: 5}, family, actor); err != nil {
		t.Fatal(err)
	}
	entries, _ = svc.Entries(legacy.ID, family)
	if len(entries) != 2 {
		t.Fatal("legacy opening not preserved")
	}
}

func TestFinanceShoppingCheckoutAtomicAndScoped(t *testing.T) {
	db := financeDB(t)
	family, actor := uuid.New(), uuid.New()
	svc := NewBudgetService(repositories.NewExpenseRepository(db), repositories.NewBudgetRepository(db), repositories.NewShoppingRepository(db))
	a, _ := svc.CreateShoppingItem(CreateShoppingItemRequest{Name: "Beras"}, family, actor)
	b, _ := svc.CreateShoppingItem(CreateShoppingItemRequest{Name: "Telur"}, family, actor)
	svc.ToggleShoppingItem(a.ID, family, actor)
	req := CheckoutShoppingRequest{ItemIDs: []uuid.UUID{a.ID, b.ID}, Amount: 50000, Category: "Belanja Rumah", Date: "2026-11-13"}
	if _, err := svc.CheckoutShopping(req, family, actor); err == nil {
		t.Fatal("unchecked item accepted")
	}
	var count int64
	db.Model(&models.Expense{}).Count(&count)
	if count != 0 {
		t.Fatal("partial checkout created an expense")
	}
	svc.ToggleShoppingItem(b.ID, family, actor)
	if _, err := svc.CheckoutShopping(req, uuid.New(), actor); err == nil {
		t.Fatal("cross family checkout allowed")
	}
	var wg sync.WaitGroup
	success := make(chan bool, 2)
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); _, err := svc.CheckoutShopping(req, family, actor); success <- err == nil }()
	}
	wg.Wait()
	close(success)
	done := 0
	for ok := range success {
		if ok {
			done++
		}
	}
	if done != 1 {
		t.Fatalf("checkout successes %d", done)
	}
	db.Model(&models.Expense{}).Count(&count)
	if count != 1 {
		t.Fatal("duplicate expense")
	}
	remaining, _ := svc.GetShoppingItems(family)
	if len(remaining) != 0 {
		t.Fatal("recorded items still active")
	}
	expenses, _ := svc.GetExpenses(family, 11, 2026, "")
	if len(expenses) != 1 || !strings.Contains(expenses[0].Description, "Beras") {
		t.Fatal("missing shopping trace")
	}
	if _, err := svc.ToggleShoppingItem(a.ID, family, actor); err == nil {
		t.Fatal("archived shopping item can be reopened")
	}
}
