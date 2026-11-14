package jwtpkg

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var ErrSessionInvalid = errors.New("sesi sudah berakhir; silakan masuk kembali")

type Claims struct {
	UserID    uuid.UUID `json:"user_id"`
	FamilyID  uuid.UUID `json:"family_id"`
	Role      string    `json:"role"`
	TokenType string    `json:"token_type"`
	SessionID uuid.UUID `json:"session_id"`
	jwt.RegisteredClaims
}

type Manager struct {
	secret        []byte
	accessExpiry  time.Duration
	refreshExpiry time.Duration
}

func NewManager(secret string, accessExpiry, refreshExpiry time.Duration) *Manager {
	return &Manager{
		secret:        []byte(secret),
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
	}
}

func (m *Manager) GenerateAccess(userID, familyID uuid.UUID, role string, session ...uuid.UUID) (string, error) {
	return m.generate(userID, familyID, role, m.accessExpiry, "access", session...)
}

func (m *Manager) GenerateRefresh(userID, familyID uuid.UUID, role string, session ...uuid.UUID) (string, error) {
	return m.generate(userID, familyID, role, m.refreshExpiry, "refresh", session...)
}

func (m *Manager) generate(userID, familyID uuid.UUID, role string, expiry time.Duration, kind string, session ...uuid.UUID) (string, error) {
	sid := uuid.Nil
	if len(session) > 0 {
		sid = session[0]
	}
	claims := &Claims{
		UserID:    userID,
		FamilyID:  familyID,
		Role:      role,
		TokenType: kind, SessionID: sid,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

func (m *Manager) Validate(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func (m *Manager) RefreshExpiry() time.Duration { return m.refreshExpiry }
