package handlers

import (
	"time"

	"keluarga-app/backend/internal/config"
	"keluarga-app/backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService *services.AuthService
	cfg         *config.JWTConfig
	googleCfg   *config.GoogleConfig
}

func NewAuthHandler(authService *services.AuthService, cfg *config.JWTConfig, googleCfg *config.GoogleConfig) *AuthHandler {
	return &AuthHandler{authService: authService, cfg: cfg, googleCfg: googleCfg}
}

// Register godoc
// @Summary Register akun baru
// @Tags auth
// @Accept json
// @Produce json
// @Param body body services.RegisterRequest true "Register payload"
// @Success 201 {object} map[string]interface{}
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req services.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "request tidak valid",
		})
	}

	if req.Name == "" || req.Email == "" || len(req.Password) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "nama, email, dan password (min 8 karakter) wajib diisi",
		})
	}

	resp, err := h.authService.Register(req)
	if err != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	setRefreshCookie(c, resp.RefreshToken)
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data":    fiber.Map{"access_token": resp.AccessToken, "refresh_token": resp.RefreshToken, "member": resp.Member},
		"message": "registrasi berhasil",
	})
}

// Login godoc
// @Summary Login dengan email & password
// @Tags auth
// @Accept json
// @Produce json
// @Param body body services.LoginRequest true "Login payload"
// @Success 200 {object} map[string]interface{}
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req services.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "request tidak valid"})
	}

	resp, err := h.authService.Login(req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": err.Error(),
			"code":    "INVALID_CREDENTIALS",
		})
	}

	setRefreshCookie(c, resp.RefreshToken)
	return c.JSON(fiber.Map{
		"data":    fiber.Map{"access_token": resp.AccessToken, "refresh_token": resp.RefreshToken, "member": resp.Member},
		"message": "login berhasil",
	})
}

// GetMe godoc
// @Summary Ambil profil user yang sedang login
// @Tags auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /auth/me [get]
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	userID := getUserID(c)
	member, err := h.authService.GetMemberByID(userID)
	if err != nil || member == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "user tidak ditemukan",
		})
	}
	return c.JSON(fiber.Map{"data": member, "message": "success"})
}

// Logout godoc
// @Summary Logout
// @Tags auth
// @Security BearerAuth
// @Success 200 {object} map[string]string
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	userID := getUserID(c)
	_ = h.authService.Logout(userID)

	c.Cookie(&fiber.Cookie{
		Name:    "refresh_token",
		Value:   "",
		Expires: time.Now().Add(-time.Hour),
		HTTPOnly: true,
	})

	return c.JSON(fiber.Map{"message": "logout berhasil"})
}

// Refresh godoc
// @Summary Refresh access token
// @Tags auth
// @Success 200 {object} map[string]interface{}
// @Router /auth/refresh [post]
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	// Coba dari cookie dulu (same-origin / production)
	// Fallback ke body JSON untuk dev cross-origin (ngrok, dsb)
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		var body struct {
			RefreshToken string `json:"refresh_token"`
		}
		_ = c.BodyParser(&body)
		refreshToken = body.RefreshToken
	}
	if refreshToken == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "refresh token tidak ditemukan",
		})
	}

	resp, err := h.authService.Refresh(refreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": err.Error(),
			"code":    "INVALID_REFRESH_TOKEN",
		})
	}

	return c.JSON(fiber.Map{
		"data":    fiber.Map{"access_token": resp.AccessToken},
		"message": "token diperbarui",
	})
}

// GoogleAuth godoc
// @Summary Redirect ke Google OAuth
// @Tags auth
// @Router /auth/google [get]
func (h *AuthHandler) GoogleAuth(c *fiber.Ctx) error {
	state := "keluarga-oauth-state" // TODO: pakai CSRF-safe random state
	url := h.authService.GoogleAuthURL(state)
	return c.Redirect(url, fiber.StatusTemporaryRedirect)
}

// GoogleCallback godoc
// @Summary Callback dari Google OAuth
// @Tags auth
// @Router /auth/google/callback [get]
func (h *AuthHandler) GoogleCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "authorization code tidak ditemukan",
		})
	}

	resp, err := h.authService.GoogleCallback(c.Context(), code)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Google login gagal: " + err.Error(),
		})
	}

	// Redirect ke frontend dengan access token di query param
	frontendURL := h.googleCfg.FrontendBaseURL + "/auth/callback"
	return c.Redirect(
		frontendURL+"?token="+resp.AccessToken,
		fiber.StatusTemporaryRedirect,
	)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func setRefreshCookie(c *fiber.Ctx, token string) {
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    token,
		HTTPOnly: true,
		Secure:   false, // set true di production
		SameSite: "Lax",
		MaxAge:   7 * 24 * 60 * 60,
	})
}
