package middleware

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"keluarga-app/backend/internal/config"
	"keluarga-app/backend/internal/models"
	jwtpkg "keluarga-app/backend/pkg/jwt"

	"github.com/gofiber/fiber/v2"
)

// NewAuthMiddleware mengembalikan middleware yang memvalidasi JWT
// dan meng-inject user_id, family_id, role ke c.Locals
// Deprecated: use AuthMiddlewareWithManager with a persistent session validator.
func NewAuthMiddleware(cfg *config.JWTConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Status(503).JSON(fiber.Map{"message": "validasi sesi belum dikonfigurasi"})
	}
}

// AuthMiddlewareWithManager — gunakan JWT Manager yang sudah diinisialisasi
func AuthMiddlewareWithManager(manager *jwtpkg.Manager, validators ...func(*jwtpkg.Claims) (*models.FamilyMember, error)) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := extractToken(c)
		if token == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "token tidak ditemukan",
				"code":    "UNAUTHORIZED",
			})
		}

		claims, err := manager.Validate(token)
		if err != nil || claims.TokenType != "access" || claims.SessionID == uuid.Nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "token tidak valid atau sudah kadaluarsa",
				"code":    "INVALID_TOKEN",
			})
		}

		if len(validators) == 0 {
			return c.Status(503).JSON(fiber.Map{"message": "validasi sesi belum tersedia"})
		}
		member, err := validators[0](claims)
		if err != nil && !errors.Is(err, jwtpkg.ErrSessionInvalid) {
			return c.Status(503).JSON(fiber.Map{"message": "sesi belum dapat diperiksa; coba lagi"})
		}
		if err != nil || member == nil {
			return c.Status(401).JSON(fiber.Map{"message": "sesi berakhir; silakan masuk kembali", "code": "INVALID_TOKEN"})
		}
		claims.Role = member.Role
		claims.FamilyID = uuid.Nil
		if member.FamilyID != nil {
			claims.FamilyID = *member.FamilyID
		}
		c.Locals("session_id", claims.SessionID)
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
