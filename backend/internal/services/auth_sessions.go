package services

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"keluarga-app/backend/internal/models"
	jwtpkg "keluarga-app/backend/pkg/jwt"
	"strings"
	"time"
	"unicode/utf8"
)

var ErrSession = jwtpkg.ErrSessionInvalid

func refreshHash(token string) string {
	b := sha256.Sum256([]byte(token))
	return hex.EncodeToString(b[:])
}
func stripFamilyInvite(m *models.FamilyMember) {
	if m.Family != nil && m.Role != "admin" {
		m.Family.InviteCode = ""
		m.Family.InviteExpiresAt = nil
	}
}
func (s *AuthService) ValidateSession(claims *jwtpkg.Claims) (*models.FamilyMember, error) {
	if claims.TokenType != "access" || claims.SessionID == uuid.Nil {
		return nil, ErrSession
	}
	var member models.FamilyMember
	err := s.memberRepo.Transaction(func(tx *gorm.DB) error {
		var session models.AuthSession
		if err := tx.Where("id = ? AND member_id = ? AND expires_at > ?", claims.SessionID, claims.UserID, time.Now()).First(&session).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrSession
			}
			return err
		}
		if err := tx.First(&member, "id = ?", claims.UserID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrSession
			}
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	stripFamilyInvite(&member)
	return &member, nil
}
func (s *AuthService) Refresh(token string) (*AuthResponse, error) {
	claims, err := s.jwtManager.Validate(token)
	if err != nil || claims.TokenType != "refresh" || claims.SessionID == uuid.Nil {
		return nil, ErrSession
	}
	var response *AuthResponse
	err = s.memberRepo.Transaction(func(tx *gorm.DB) error {
		var member models.FamilyMember
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&member, "id = ?", claims.UserID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrSession
			}
			return err
		}
		var session models.AuthSession
		if err := tx.Where("id = ? AND member_id = ? AND refresh_hash = ? AND expires_at > ?", claims.SessionID, claims.UserID, refreshHash(token), time.Now()).First(&session).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrSession
			}
			return err
		}
		family := uuid.Nil
		if member.FamilyID != nil {
			family = *member.FamilyID
		}
		access, err := s.jwtManager.GenerateAccess(member.ID, family, member.Role, session.ID)
		if err != nil {
			return err
		}
		stripFamilyInvite(&member)
		response = &AuthResponse{AccessToken: access, RefreshToken: token, Member: &member}
		return nil
	})
	return response, err
}
func (s *AuthService) LogoutSession(userID, sessionID uuid.UUID, endpoint string) error {
	return s.memberRepo.Transaction(func(tx *gorm.DB) error {
		var m models.FamilyMember
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&m, "id = ?", userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrSession
			}
			return err
		}
		if err := tx.Where("member_id = ? AND (session_id = ? OR endpoint = ?)", userID, sessionID, endpoint).Delete(&models.PushSubscription{}).Error; err != nil {
			return err
		}
		return tx.Where("id = ? AND member_id = ?", sessionID, userID).Delete(&models.AuthSession{}).Error
	})
}
func (s *AuthService) buildAuthResponse(member *models.FamilyMember) (*AuthResponse, error) {
	var response *AuthResponse
	err := s.memberRepo.Transaction(func(tx *gorm.DB) error {
		// Re-read under lock: concurrent role/removal/password changes cannot issue a stale login.
		var current models.FamilyMember
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&current, "id = ?", member.ID).Error; err != nil {
			return err
		}
		if current.PasswordHash != member.PasswordHash {
			return ErrSession
		}
		family := uuid.Nil
		if current.FamilyID != nil {
			family = *current.FamilyID
		}
		sid := uuid.New()
		access, err := s.jwtManager.GenerateAccess(current.ID, family, current.Role, sid)
		if err != nil {
			return err
		}
		refresh, err := s.jwtManager.GenerateRefresh(current.ID, family, current.Role, sid)
		if err != nil {
			return err
		}
		session := models.AuthSession{MemberID: current.ID, RefreshHash: refreshHash(refresh), ExpiresAt: time.Now().Add(s.jwtManager.RefreshExpiry())}
		session.ID = sid
		if err = tx.Create(&session).Error; err != nil {
			return err
		}
		stripFamilyInvite(&current)
		response = &AuthResponse{AccessToken: access, RefreshToken: refresh, Member: &current}
		return nil
	})
	return response, err
}
func (s *AuthService) ChangePassword(userID, sessionID uuid.UUID, oldPassword, newPassword string) error {
	if len(newPassword) < 8 || len(newPassword) > 72 || utf8.RuneCountInString(newPassword) < 8 {
		return errors.New("password baru harus 8–72 karakter dan maksimal 72 byte")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.memberRepo.Transaction(func(tx *gorm.DB) error {
		var member models.FamilyMember
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&member, "id = ?", userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrSession
			}
			return err
		}
		if member.AuthProvider == "google" {
			return errors.New("akun Google mengelola password melalui Google")
		}
		if bcrypt.CompareHashAndPassword([]byte(member.PasswordHash), []byte(oldPassword)) != nil {
			return errors.New("password saat ini tidak sesuai")
		}
		if strings.TrimSpace(newPassword) == "" {
			return errors.New("password baru wajib diisi")
		}
		if err := tx.Model(&member).Update("password_hash", string(hash)).Error; err != nil {
			return err
		}
		if err := tx.Where("member_id = ? AND (session_id <> ? OR session_id IS NULL)", userID, sessionID).Delete(&models.PushSubscription{}).Error; err != nil {
			return err
		}
		// Keep the current device; revoke every other login.
		return tx.Where("member_id = ? AND id <> ?", userID, sessionID).Delete(&models.AuthSession{}).Error
	})
}
