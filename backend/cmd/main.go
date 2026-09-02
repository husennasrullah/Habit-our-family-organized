package main

import (
	"fmt"
	"log"
	"time"

	"keluarga-app/backend/internal/config"
	"keluarga-app/backend/internal/database"
	"keluarga-app/backend/internal/handlers"
	"keluarga-app/backend/internal/middleware"
	"keluarga-app/backend/internal/repositories"
	"keluarga-app/backend/internal/scheduler"
	"keluarga-app/backend/internal/services"
	"keluarga-app/backend/internal/websocket"
	jwtpkg "keluarga-app/backend/pkg/jwt"
	"keluarga-app/backend/pkg/storage"

	fiberws "github.com/gofiber/websocket/v2"
	"github.com/gofiber/fiber/v2"
)

func main() {
	// Load config
	cfg := config.Load()

	// Connect databases
	database.ConnectPostgres(&cfg.DB)
	database.ConnectRedis(&cfg.Redis)

	// Run migrations
	database.AutoMigrate()

	// ─── JWT Manager ──────────────────────────────────────────────────────────
	accessExpiry, err := time.ParseDuration(cfg.JWT.AccessExpiry)
	if err != nil {
		accessExpiry = 15 * time.Minute
	}
	refreshExpiry, err := time.ParseDuration(cfg.JWT.RefreshExpiry)
	if err != nil {
		refreshExpiry = 7 * 24 * time.Hour
	}
	jwtManager := jwtpkg.NewManager(cfg.JWT.Secret, accessExpiry, refreshExpiry)

	// ─── Storage ──────────────────────────────────────────────────────────────
	// Inject sebagai interface Storage — ganti provider = ganti NewXxxStorage()
	storageClient := storage.NewMinIOStorage(&cfg.Storage)
	_ = storageClient // akan dipakai oleh memory & document service

	// ─── Repositories ─────────────────────────────────────────────────────────
	memberRepo   := repositories.NewFamilyMemberRepository(database.DB)
	familyRepo   := repositories.NewFamilyRepository(database.DB)
	eventRepo    := repositories.NewEventRepository(database.DB)
	taskRepo     := repositories.NewTaskRepository(database.DB)
	expenseRepo  := repositories.NewExpenseRepository(database.DB)
	budgetRepo   := repositories.NewBudgetRepository(database.DB)
	shoppingRepo := repositories.NewShoppingRepository(database.DB)
	memoryRepo   := repositories.NewMemoryRepository(database.DB)
	kidsRepo     := repositories.NewKidsRepository(database.DB)
	docRepo      := repositories.NewDocumentRepository(database.DB)
	mealRepo     := repositories.NewMealPlanRepository(database.DB)

	// ─── Services ─────────────────────────────────────────────────────────────
	authService     := services.NewAuthService(memberRepo, jwtManager, database.RDB, &cfg.Google)
	familyService   := services.NewFamilyService(familyRepo, memberRepo)
	eventService    := services.NewEventService(eventRepo)
	taskService     := services.NewTaskService(taskRepo)
	budgetService   := services.NewBudgetService(expenseRepo, budgetRepo, shoppingRepo)
	memoryService   := services.NewMemoryService(memoryRepo, storageClient)
	kidsService     := services.NewKidsService(kidsRepo)
	docService      := services.NewDocumentService(docRepo, storageClient)
	mealPlanService := services.NewMealPlanService(mealRepo)
	pushSubRepo     := repositories.NewPushSubscriptionRepository(database.DB)

	// ─── Scheduler: notifikasi meal plan jam 04:00 ────────────────────────────
	mealNotifier := scheduler.NewMealNotifier(mealPlanService, pushSubRepo, &cfg.Push)
	go mealNotifier.StartScheduler()

	// ─── Handlers ─────────────────────────────────────────────────────────────
	authHandler     := handlers.NewAuthHandler(authService, &cfg.JWT, &cfg.Google)
	familyHandler   := handlers.NewFamilyHandler(familyService)
	eventHandler    := handlers.NewEventHandler(eventService)
	taskHandler     := handlers.NewTaskHandler(taskService)
	budgetHandler   := handlers.NewBudgetHandler(budgetService)
	memoryHandler   := handlers.NewMemoryHandler(memoryService)
	kidsHandler     := handlers.NewKidsHandler(kidsService)
	docHandler      := handlers.NewDocumentHandler(docService)
	mealPlanHandler := handlers.NewMealPlanHandler(mealPlanService)
	pushHandler     := handlers.NewPushHandler(pushSubRepo)

	// ─── WebSocket Hub ────────────────────────────────────────────────────────
	wsHub := websocket.NewHub()

	// ─── Fiber App ────────────────────────────────────────────────────────────
	app := fiber.New(fiber.Config{
		AppName:   "Keluarga API v1.0",
		BodyLimit: 50 * 1024 * 1024, // 50MB — untuk upload foto
	})

	// Middleware global
	app.Use(middleware.SetupRecover())
	app.Use(middleware.SetupLogger())
	app.Use(middleware.SetupCORS())

	// ─── Routes ───────────────────────────────────────────────────────────────
	app.Get("/health", handlers.HealthCheck)

	api := app.Group("/api/v1")

	// JWT middleware — dipakai di semua protected routes
	authMw := middleware.AuthMiddlewareWithManager(jwtManager)

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Get("/google", authHandler.GoogleAuth)
	auth.Get("/google/callback", authHandler.GoogleCallback)

	// Auth routes (protected)
	authProtected := api.Group("/auth", authMw)
	authProtected.Post("/logout", authHandler.Logout)
	authProtected.Get("/me", authHandler.GetMe)

	// Family routes
	family := api.Group("/family", authMw)
	family.Post("", familyHandler.CreateFamily)
	family.Get("", familyHandler.GetFamily)
	family.Post("/join", familyHandler.JoinFamily)
	family.Get("/members", familyHandler.GetMembers)
	family.Put("/members/:id", familyHandler.UpdateMember)
	family.Delete("/members/:id", middleware.RequireRole("admin"), familyHandler.DeleteMember)

	// Calendar / Events routes
	events := api.Group("/events", authMw)
	events.Get("", eventHandler.GetEvents)
	events.Post("", eventHandler.CreateEvent)
	events.Put("/:id", eventHandler.UpdateEvent)
	events.Delete("/:id", eventHandler.DeleteEvent)

	// Tasks / Chore routes
	tasks := api.Group("/tasks", authMw)
	tasks.Get("", taskHandler.GetTasks)
	tasks.Get("/leaderboard", taskHandler.GetLeaderboard)
	tasks.Post("", taskHandler.CreateTask)
	tasks.Put("/:id", taskHandler.UpdateTask)
	tasks.Patch("/:id/complete", taskHandler.CompleteTask)
	tasks.Delete("/:id", taskHandler.DeleteTask)

	// Budget / Expense routes
	expenses := api.Group("/expenses", authMw)
	expenses.Get("", budgetHandler.GetExpenses)
	expenses.Get("/summary", budgetHandler.GetSummary)
	expenses.Post("", budgetHandler.CreateExpense)
	expenses.Put("/:id", budgetHandler.UpdateExpense)
	expenses.Delete("/:id", budgetHandler.DeleteExpense)

	budgets := api.Group("/budgets", authMw)
	budgets.Get("", budgetHandler.GetBudgets)
	budgets.Post("", budgetHandler.UpsertBudget)
	budgets.Delete("/:id", budgetHandler.DeleteBudget)

	shopping := api.Group("/shopping-items", authMw)
	shopping.Get("", budgetHandler.GetShoppingItems)
	shopping.Post("", budgetHandler.CreateShoppingItem)
	shopping.Patch("/:id/check", budgetHandler.ToggleShoppingItem)
	shopping.Delete("/clear-checked", budgetHandler.ClearCheckedItems)
	shopping.Delete("/:id", budgetHandler.DeleteShoppingItem)

	// Memory / Journal routes
	memories := api.Group("/memories", authMw)
	memories.Get("", memoryHandler.GetMemories)
	memories.Post("", memoryHandler.CreateMemory)
	memories.Get("/:id", memoryHandler.GetMemory)
	memories.Put("/:id", memoryHandler.UpdateMemory)
	memories.Delete("/:id", memoryHandler.DeleteMemory)
	memories.Post("/:id/photos", memoryHandler.UploadPhotos)
	memories.Delete("/:id/photos/:photo_id", memoryHandler.DeletePhoto)
	memories.Get("/:id/photos/:photo_id/serve", memoryHandler.ServePhoto)

	// Kids Tracker routes
	kids := api.Group("/kids", authMw)
	kids.Get("",    kidsHandler.GetKids)
	kids.Post("",   kidsHandler.CreateKid)
	kids.Put("/:id",    kidsHandler.UpdateKid)
	kids.Delete("/:id", kidsHandler.DeleteKid)

	kids.Get("/:id/growth",  kidsHandler.GetGrowth)
	kids.Post("/:id/growth", kidsHandler.AddGrowth)

	kids.Get("/:id/vaccines",                       kidsHandler.GetVaccines)
	kids.Post("/:id/vaccines",                      kidsHandler.AddVaccine)
	kids.Patch("/:id/vaccines/:vaccine_id/given",   kidsHandler.MarkVaccineGiven)

	kids.Get("/:id/milestones",                          kidsHandler.GetMilestones)
	kids.Post("/:id/milestones",                         kidsHandler.AddMilestone)
	kids.Patch("/:id/milestones/:milestone_id/toggle",   kidsHandler.ToggleMilestone)

	kids.Get("/:id/health",  kidsHandler.GetHealth)
	kids.Post("/:id/health", kidsHandler.AddHealth)

	// Documents routes
	docs := api.Group("/documents", authMw)
	docs.Get("",        docHandler.GetDocuments)
	docs.Post("",       docHandler.UploadDocument)
	docs.Delete("/:id", docHandler.DeleteDocument)

	// Meal Plan routes
	meals := api.Group("/meal-plans", authMw)
	meals.Get("",        mealPlanHandler.GetMealPlans)
	meals.Post("",       mealPlanHandler.CreateMealPlan)
	meals.Put("/:id",    mealPlanHandler.UpdateMealPlan)
	meals.Delete("/:id", mealPlanHandler.DeleteMealPlan)

	// Push Notification routes
	push := api.Group("/push")
	push.Get("/vapid-key", handlers.GetVAPIDPublicKey(cfg.Push.VAPIDPublicKey))
	push.Post("/subscribe",   authMw, pushHandler.Subscribe)
	push.Delete("/subscribe", authMw, pushHandler.Unsubscribe)

	// WebSocket route
	app.Use("/ws", func(c *fiber.Ctx) error {
		if fiberws.IsWebSocketUpgrade(c) {
			// Inject auth claims ke locals sebelum upgrade
			return authMw(c)
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws", websocket.Handler(wsHub))

	// ─── Start Server ─────────────────────────────────────────────────────────
	port := cfg.App.Port
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s (env: %s)", port, cfg.App.Env)
	if err := app.Listen(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
