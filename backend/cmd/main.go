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
 "github.com/google/uuid"
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
	// Shared provider for memories, documents and trips.
	storageClient := storage.NewClientOrDisabled(&cfg.Storage)

	// ─── Repositories ─────────────────────────────────────────────────────────
	memberRepo   := repositories.NewFamilyMemberRepository(database.DB)
	familyRepo   := repositories.NewFamilyRepository(database.DB)
	eventRepo    := repositories.NewEventRepository(database.DB)
	taskRepo     := repositories.NewTaskRepository(database.DB)
	expenseRepo  := repositories.NewExpenseRepository(database.DB)
	budgetRepo   := repositories.NewBudgetRepository(database.DB)
	shoppingRepo := repositories.NewShoppingRepository(database.DB)
	memoryRepo    := repositories.NewMemoryRepository(database.DB)
	kidsRepo      := repositories.NewKidsRepository(database.DB)
	docRepo       := repositories.NewDocumentRepository(database.DB)
	mealRepo      := repositories.NewMealPlanRepository(database.DB)
	goalRepo      := repositories.NewFinancialGoalRepository(database.DB)
	tripRepo      := repositories.NewTripRepository(database.DB)

	// ─── Services ─────────────────────────────────────────────────────────────
	authService     := services.NewAuthService(memberRepo, jwtManager, database.RDB, &cfg.Google)
	familyService   := services.NewFamilyService(familyRepo, memberRepo, storageClient)
	eventService    := services.NewEventService(eventRepo)
	taskService     := services.NewTaskService(taskRepo)
	budgetService   := services.NewBudgetService(expenseRepo, budgetRepo, shoppingRepo)
	memoryService   := services.NewMemoryService(memoryRepo, storageClient)
	kidsService     := services.NewKidsService(kidsRepo)
	docService, docErr := services.NewDocumentServiceWithKey(docRepo, storageClient, cfg.Storage.EncryptionKey)
	if docErr != nil {
		log.Printf("documents: encryption disabled (%v); API remains available",docErr)
		docService=services.NewDocumentService(docRepo,storageClient)
	}
	mealPlanService := services.NewMealPlanService(mealRepo)
	goalService     := services.NewFinancialGoalService(goalRepo)
	tripService     := services.NewTripService(tripRepo, eventRepo, storageClient)
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
	goalHandler     := handlers.NewFinancialGoalHandler(goalService)
	tripHandler     := handlers.NewTripHandler(tripService)
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
	authMw := middleware.AuthMiddlewareWithManager(jwtManager, authService.ValidateSession)

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
	authProtected.Put("/password", authHandler.ChangePassword)

	// Family routes
	family := api.Group("/family", authMw)
	family.Post("", familyHandler.CreateFamily)
	family.Get("", familyHandler.GetFamily)
	family.Put("", middleware.RequireRole("admin"), familyHandler.UpdateFamily)
	family.Post("/invite-code", middleware.RequireRole("admin"), familyHandler.RotateInvite)
	family.Post("/avatar", familyHandler.UploadAvatar)
	family.Get("/members/:id/avatar", familyHandler.Avatar)
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
	shopping.Post("/checkout", budgetHandler.CheckoutShopping)
	shopping.Patch("/:id/check", budgetHandler.ToggleShoppingItem)
	shopping.Delete("/clear-checked", budgetHandler.ClearCheckedItems)
	shopping.Delete("/:id", budgetHandler.DeleteShoppingItem)

	// Memory / Journal routes
	memories := api.Group("/memories", authMw)
	memories.Get("", memoryHandler.GetMemories)
	memories.Post("", middleware.RequireRole("admin", "member"), memoryHandler.CreateMemory)
	memories.Get("/:id", memoryHandler.GetMemory)
	memories.Put("/:id", middleware.RequireRole("admin", "member"), memoryHandler.UpdateMemory)
	memories.Delete("/:id", middleware.RequireRole("admin", "member"), memoryHandler.DeleteMemory)
	memories.Post("/:id/photos", middleware.RequireRole("admin", "member"), memoryHandler.UploadPhotos)
	memories.Delete("/:id/photos/:photo_id", middleware.RequireRole("admin", "member"), memoryHandler.DeletePhoto)
	memories.Get("/:id/photos/:photo_id/serve", memoryHandler.ServePhoto)

	// Kids Tracker routes
	kids := api.Group("/kids", authMw, middleware.RequireRole("admin", "member"), func(c *fiber.Ctx) error {
		if c.Locals("family_id") == uuid.Nil {
			return c.Status(400).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
		}
		return c.Next()
	})
	kids.Get("", kidsHandler.GetKids)
	kids.Post("", kidsHandler.CreateKid)
	kids.Put("/:id", kidsHandler.UpdateKid)
	kids.Delete("/:id", kidsHandler.DeleteKid)

	kids.Get("/:id/growth", kidsHandler.GetGrowth)
	kids.Post("/:id/growth", kidsHandler.AddGrowth)

	kids.Get("/:id/vaccines", kidsHandler.GetVaccines)
	kids.Post("/:id/vaccines", kidsHandler.AddVaccine)
	kids.Patch("/:id/vaccines/:vaccine_id/given", kidsHandler.MarkVaccineGiven)

	kids.Get("/:id/milestones", kidsHandler.GetMilestones)
	kids.Post("/:id/milestones", kidsHandler.AddMilestone)
	kids.Patch("/:id/milestones/:milestone_id/toggle", kidsHandler.ToggleMilestone)

	kids.Get("/:id/health", kidsHandler.GetHealth)
	kids.Post("/:id/health", kidsHandler.AddHealth)

	kids.Put("/:id/growth/:record_id", kidsHandler.UpdateGrowth)
	kids.Delete("/:id/growth/:record_id", kidsHandler.DeleteGrowth)
	kids.Put("/:id/vaccines/:record_id", kidsHandler.UpdateVaccine)
	kids.Delete("/:id/vaccines/:record_id", kidsHandler.DeleteVaccine)
	kids.Put("/:id/milestones/:record_id", kidsHandler.UpdateMilestone)
	kids.Delete("/:id/milestones/:record_id", kidsHandler.DeleteMilestone)
	kids.Put("/:id/health/:record_id", kidsHandler.UpdateHealth)
	kids.Delete("/:id/health/:record_id", kidsHandler.DeleteHealth)
	kids.Patch("/:id/milestones/:milestone_id/achievement", kidsHandler.SetMilestoneAchievement)

	// Documents routes
	docs := api.Group("/documents", authMw, middleware.RequireRole("admin", "member"))
	docs.Get("",        docHandler.GetDocuments)
	docs.Post("",       docHandler.UploadDocument)
	docs.Get("/capabilities", docHandler.Capabilities)
	docs.Get("/:id/download", docHandler.Download)
	docs.Put("/:id", docHandler.Update)
	docs.Delete("/:id", docHandler.DeleteDocument)

	// Financial Goals routes
	goals := api.Group("/financial-goals", authMw)
	goals.Get("",            goalHandler.GetGoals)
	goals.Get("/:id/entries", goalHandler.GetEntries)
	goals.Post("",           goalHandler.CreateGoal)
	goals.Put("/:id",        goalHandler.UpdateGoal)
	goals.Patch("/:id/progress", goalHandler.AddFund)
	goals.Delete("/:id",    goalHandler.DeleteGoal)

	// Meal Plan routes
	meals := api.Group("/meal-plans", authMw)
	meals.Get("",        mealPlanHandler.GetMealPlans)
	meals.Post("",       mealPlanHandler.CreateMealPlan)
	meals.Put("/:id",    mealPlanHandler.UpdateMealPlan)
	meals.Delete("/:id", mealPlanHandler.DeleteMealPlan)

	// Trips & Vacation Planner routes
	trips := api.Group("/trips", authMw)
	trips.Get("",                                  tripHandler.GetTrips)
	trips.Post("",                                 tripHandler.CreateTrip)
	trips.Get("/:id",                              tripHandler.GetTripByID)
	trips.Put("/:id",                              tripHandler.UpdateTrip)
	trips.Delete("/:id",                           tripHandler.DeleteTrip)
	trips.Post("/:id/itineraries",                                               tripHandler.AddItinerary)
	trips.Put("/:id/itineraries/:itinerary_id",                                  tripHandler.UpdateItinerary)
	trips.Delete("/:id/itineraries/:itinerary_id",                               tripHandler.DeleteItinerary)
	trips.Post("/:id/itineraries/:itinerary_id/budgets",                         tripHandler.AddItineraryBudget)
	trips.Delete("/:id/itineraries/:itinerary_id/budgets/:budget_id",            tripHandler.DeleteItineraryBudget)
	trips.Post("/:id/packing",                                                   tripHandler.AddPackingItem)
	trips.Patch("/:id/packing/:item_id/toggle",    tripHandler.TogglePackingItem)
	trips.Delete("/:id/packing/:item_id", tripHandler.DeletePackingItem)
	// Trips - Expenses & Split Bill
	trips.Post("/:id/expenses", tripHandler.AddExpense)
	trips.Put("/:id/expenses/:expense_id", tripHandler.UpdateExpense)
	trips.Delete("/:id/expenses/:expense_id", tripHandler.DeleteExpense)
	trips.Patch("/:id/expenses/:expense_id/splits/:split_id/toggle", tripHandler.ToggleExpenseSplit)
	// Trips - Documents & Tickets
	trips.Post("/:id/documents", tripHandler.UploadDocument)
	trips.Get("/:id/documents/:doc_id/download", tripHandler.DownloadDocument)
	trips.Delete("/:id/documents/:doc_id", tripHandler.DeleteDocument)

	// Push Notification routes
	push := api.Group("/push")
	push.Get("/subscription", authMw, pushHandler.Status)
	push.Get("/vapid-key", handlers.GetVAPIDPublicKey(cfg.Push.VAPIDPublicKey, cfg.Push.VAPIDPrivateKey))
	push.Post("/subscribe",   authMw, middleware.RequireRole("admin", "member"), pushHandler.Subscribe)
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
