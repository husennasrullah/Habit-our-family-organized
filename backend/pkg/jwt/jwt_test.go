package jwtpkg

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"testing"
	"time"
)

func TestTypedSessionTokens(t *testing.T) {
	m := NewManager("test-secret", time.Minute, time.Hour)
	u, f, s := uuid.New(), uuid.New(), uuid.New()
	a, _ := m.GenerateAccess(u, f, "admin", s)
	r, _ := m.GenerateRefresh(u, f, "admin", s)
	ac, _ := m.Validate(a)
	rc, _ := m.Validate(r)
	if ac.TokenType != "access" || rc.TokenType != "refresh" || ac.SessionID != s || rc.SessionID != s || a == r {
		t.Fatal("token separation failed")
	}
	wrong := jwt.NewWithClaims(jwt.SigningMethodHS512, ac)
	signed, _ := wrong.SignedString([]byte("test-secret"))
	if _, err := m.Validate(signed); err == nil {
		t.Fatal("unexpected algorithm accepted")
	}
}
