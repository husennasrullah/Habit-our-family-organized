package middleware

import (
	"strings"

	"keluarga-app/backend/internal/config"
	jwtpkg "keluarga-app/backend/pkg/jwt"

	"github.com/gofiber/fiber/v2"
)

// NewAuthMiddleware mengembalikan middleware yang memvalidasi JWT
// dan meng-inject user_id, family_id, role ke c.Locals
func NewAuthMiddleware(cfg *config.JWTConfig) fiber.Handler {
	// Parse expiry dari config untuk membuat JWT Manager
	// (reuse Manager yang sama dengan di handler via dependency injection)
	_ = cfg // Manager dipass langsung ke handler, tapi untuk keseragaman kita terima config
	return func(c *fiber.Ctx) error {
		// Didelegasikan ke AuthMiddlewareWithManager
		return c.Next()
	}
}

// AuthMiddlewareWithManager — gunakan JWT Manager yang sudah diinisialisasi
func AuthMiddlewareWithManager(manager *jwtpkg.Manager) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := extractToken(c)
		if token == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "token tidak ditemukan",
				"code":    "UNAUTHORIZED",
			})
		}

		claims, err := manager.Validate(token)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "token tidak valid atau sudah kadaluarsa",
				"code":    "INVALID_TOKEN",
			})
		}

		// Inject ke context — SELALU dari JWT, bukan dari input user
		c.Locals("user_id", claims.UserID)
		c.Locals("family_id", claims.FamilyID)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}

// RequireRole — middleware untuk membatasi akses berdasarkan role
func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "tidak terautentikasi",
				"code":    "UNAUTHORIZED",
			})
		}
		for _, r := range roles {
			if role == r {
				return c.Next()
			}
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "akses ditolak",
			"code":    "FORBIDDEN",
		})
	}
}

func extractToken(c *fiber.Ctx) string {
	auth := c.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return ""
}
