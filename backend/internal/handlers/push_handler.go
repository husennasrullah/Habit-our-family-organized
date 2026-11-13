package handlers

import (
	"errors"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/pushvalidation"
	"keluarga-app/backend/internal/repositories"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type PushHandler struct {
	repo *repositories.PushSubscriptionRepository
}

func NewPushHandler(repo *repositories.PushSubscriptionRepository) *PushHandler {
	return &PushHandler{repo: repo}
}

type subscribeRequest struct {
	Endpoint string `json:"endpoint"`
	P256DH   string `json:"p256dh"`
	Auth     string `json:"auth"`
}

// Subscribe godoc
// @Summary Daftarkan push subscription browser
// @Tags push
// @Security BearerAuth
// @Accept json
// @Router /push/subscribe [post]
func (h *PushHandler) Subscribe(c *fiber.Ctx) error {
	familyID := getFamilyID(c)
	memberID := getUserID(c)

	var req subscribeRequest
	if err := c.BodyParser(&req); err != nil || req.Endpoint == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "payload tidak valid"})
	}

	if err := pushvalidation.Validate(req.Endpoint, req.P256DH, req.Auth); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": err.Error()})
	}
	sub := &models.PushSubscription{
		FamilyID: familyID,
		MemberID: memberID,
		Endpoint: req.Endpoint,
		P256DH:   req.P256DH,
		Auth:     req.Auth,
	}
	if err := h.repo.Upsert(sub); err != nil {
		if errors.Is(err, repositories.ErrPushSubscriptionOwned) {
			return c.Status(409).JSON(fiber.Map{"message": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "subscription berhasil disimpan"})
}

// Unsubscribe godoc
// @Summary Hapus push subscription
// @Tags push
// @Security BearerAuth
// @Router /push/subscribe [delete]
func (h *PushHandler) Unsubscribe(c *fiber.Ctx) error {
	var req struct {
		Endpoint string `json:"endpoint"`
	}
	if err := c.BodyParser(&req); err != nil || req.Endpoint == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "endpoint wajib diisi"})
	}
	if err := h.repo.DeleteByEndpoint(req.Endpoint, getFamilyID(c), getUserID(c)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "subscription dihapus"})
}

// GetVAPIDPublicKey mengembalikan VAPID public key untuk frontend
// @Summary Ambil VAPID public key
// @Tags push
// @Router /push/vapid-key [get]
func GetVAPIDPublicKey(publicKey, privateKey string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if publicKey == "" || privateKey == "" {
			return c.Status(503).JSON(fiber.Map{"message": "notifikasi belum dikonfigurasi di server"})
		}
		return c.JSON(fiber.Map{"public_key": publicKey})
	}
}

// helper agar bisa dipakai di handler lain
func getFamilyIDFromUUID(c *fiber.Ctx) uuid.UUID {
	return getFamilyID(c)
}

// Status reports only the current member's subscription, never another account's owner.
// @Summary Periksa langganan push anggota saat ini
// @Tags push
// @Security BearerAuth
// @Param endpoint query string true "Browser push endpoint"
// @Success 200 {object} map[string]interface{}
// @Router /push/subscription [get]
func (h *PushHandler) Status(c *fiber.Ctx) error {
	subscribed, err := h.repo.IsSubscribed(c.Query("endpoint"), getFamilyID(c), getUserID(c))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "gagal memeriksa notifikasi"})
	}
	return c.JSON(fiber.Map{"subscribed": subscribed})
}
