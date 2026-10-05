package handlers

import (
	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type TripHandler struct {
	svc *services.TripService
}

func NewTripHandler(svc *services.TripService) *TripHandler {
	return &TripHandler{svc: svc}
}

// ─── Trips ────────────────────────────────────────────────────────────────────

func (h *TripHandler) GetTrips(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}

	trips, err := h.svc.GetTrips(familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil data liburan"})
	}

	return c.JSON(fiber.Map{"data": trips, "message": "success"})
}

func (h *TripHandler) GetTripByID(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}

	trip, err := h.svc.GetTripByID(id, familyID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "liburan tidak ditemukan"})
	}

	return c.JSON(fiber.Map{"data": trip, "message": "success"})
}

func (h *TripHandler) CreateTrip(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	userID := getUserID(c)
	if familyID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "belum bergabung ke keluarga"})
	}

	var req services.CreateTripRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request body tidak valid"})
	}

	trip, err := h.svc.CreateTrip(&req, familyID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": trip, "message": "rencana liburan berhasil dibuat"})
}

func (h *TripHandler) UpdateTrip(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}

	var req services.UpdateTripRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request body tidak valid"})
	}

	trip, err := h.svc.UpdateTrip(id, familyID, &req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"data": trip, "message": "rencana liburan berhasil diupdate"})
}

func (h *TripHandler) DeleteTrip(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}

	if err := h.svc.DeleteTrip(id, familyID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal menghapus rencana liburan"})
	}

	return c.JSON(fiber.Map{"message": "rencana liburan berhasil dihapus"})
}

// ─── Itineraries ─────────────────────────────────────────────────────────────

func (h *TripHandler) AddItinerary(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}

	var req services.CreateItineraryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request body tidak valid"})
	}

	item, err := h.svc.AddItinerary(tripID, familyID, &req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": item, "message": "jadwal itinerary berhasil ditambahkan"})
}

func (h *TripHandler) UpdateItinerary(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}
	itineraryID, err := uuid.Parse(c.Params("itinerary_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID itinerary tidak valid"})
	}

	var req services.UpdateItineraryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request body tidak valid"})
	}

	item, err := h.svc.UpdateItinerary(itineraryID, tripID, familyID, &req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"data": item, "message": "jadwal itinerary berhasil diperbarui"})
}

func (h *TripHandler) DeleteItinerary(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}
	itineraryID, err := uuid.Parse(c.Params("itinerary_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID itinerary tidak valid"})
	}

	if err := h.svc.DeleteItinerary(itineraryID, tripID, familyID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal menghapus jadwal itinerary"})
	}

	return c.JSON(fiber.Map{"message": "jadwal itinerary berhasil dihapus"})
}

// ─── Itinerary Budget Items ───────────────────────────────────────────────────

func (h *TripHandler) AddItineraryBudget(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}
	itineraryID, err := uuid.Parse(c.Params("itinerary_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID itinerary tidak valid"})
	}

	var req services.CreateItineraryBudgetRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request body tidak valid"})
	}

	item, err := h.svc.AddItineraryBudget(itineraryID, tripID, familyID, &req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": item, "message": "budget berhasil ditambahkan"})
}

func (h *TripHandler) DeleteItineraryBudget(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}
	itineraryID, err := uuid.Parse(c.Params("itinerary_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID itinerary tidak valid"})
	}
	budgetID, err := uuid.Parse(c.Params("budget_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID budget tidak valid"})
	}

	if err := h.svc.DeleteItineraryBudget(budgetID, itineraryID, tripID, familyID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal menghapus budget"})
	}

	return c.JSON(fiber.Map{"message": "budget berhasil dihapus"})
}

// ─── Packing Items ───────────────────────────────────────────────────────────

func (h *TripHandler) AddPackingItem(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}

	var req services.CreatePackingItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request body tidak valid"})
	}

	item, err := h.svc.AddPackingItem(tripID, familyID, &req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": item, "message": "barang bawaan berhasil ditambahkan"})
}

func (h *TripHandler) TogglePackingItem(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	userID := getUserID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}
	itemID, err := uuid.Parse(c.Params("item_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID barang tidak valid"})
	}

	item, err := h.svc.TogglePackingItem(itemID, tripID, familyID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"data": item, "message": "status barang bawaan diupdate"})
}

func (h *TripHandler) DeletePackingItem(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}
	itemID, err := uuid.Parse(c.Params("item_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID barang tidak valid"})
	}

	if err := h.svc.DeletePackingItem(itemID, tripID, familyID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal menghapus barang bawaan"})
	}

	return c.JSON(fiber.Map{"message": "barang bawaan berhasil dihapus"})
}

// ─── Expenses ────────────────────────────────────────────────────────────────

func (h *TripHandler) AddExpense(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}

	var req services.CreateTripExpenseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request body tidak valid"})
	}

	expense, err := h.svc.AddExpense(tripID, familyID, &req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": expense, "message": "pengeluaran berhasil ditambahkan"})
}

func (h *TripHandler) UpdateExpense(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}
	expenseID, err := uuid.Parse(c.Params("expense_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID pengeluaran tidak valid"})
	}

	var req services.CreateTripExpenseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request body tidak valid"})
	}

	expense, err := h.svc.UpdateExpense(expenseID, tripID, familyID, &req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"data": expense, "message": "pengeluaran berhasil diperbarui"})
}

func (h *TripHandler) DeleteExpense(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}
	expenseID, err := uuid.Parse(c.Params("expense_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID pengeluaran tidak valid"})
	}

	if err := h.svc.DeleteExpense(expenseID, tripID, familyID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal menghapus pengeluaran"})
	}

	return c.JSON(fiber.Map{"message": "pengeluaran berhasil dihapus"})
}

func (h *TripHandler) ToggleExpenseSplit(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}
	expenseID, err := uuid.Parse(c.Params("expense_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID pengeluaran tidak valid"})
	}
	splitID, err := uuid.Parse(c.Params("split_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID split tidak valid"})
	}

	split, err := h.svc.ToggleExpenseSplit(splitID, expenseID, tripID, familyID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"data": split, "message": "status patungan diupdate"})
}

// ─── Documents ───────────────────────────────────────────────────────────────

func (h *TripHandler) UploadDocument(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	userID := getUserID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}

	fh, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "file wajib diupload"})
	}

	title := c.FormValue("title")
	docType := c.FormValue("doc_type")
	notes := c.FormValue("notes")

	doc, err := h.svc.UploadDocument(tripID, familyID, userID, title, docType, notes, fh)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": doc, "message": "dokumen berhasil diupload"})
}

func (h *TripHandler) DeleteDocument(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	tripID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID liburan tidak valid"})
	}
	docID, err := uuid.Parse(c.Params("doc_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "ID dokumen tidak valid"})
	}

	if err := h.svc.DeleteDocument(docID, tripID, familyID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal menghapus dokumen"})
	}

	return c.JSON(fiber.Map{"message": "dokumen berhasil dihapus"})
}
