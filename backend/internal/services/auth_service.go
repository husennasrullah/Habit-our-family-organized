package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"keluarga-app/backend/internal/config"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	jwtpkg "keluarga-app/backend/pkg/jwt"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	googleOAuth "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

// ─── Request / Response DTOs ────────────────────────────────────────────────

type RegisterRequest struct {
	Name     string `json:"name"     validate:"required,min=2"`
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	AccessToken  string               `json:"access_token"`
	RefreshToken string               `json:"refresh_token"`
	Member       *models.FamilyMember `json:"member"`
}

// ─── Service ─────────────────────────────────────────────────────────────────

type AuthService struct {
	memberRepo *repositories.FamilyMemberRepository
	jwtManager *jwtpkg.Manager
	rdb        *redis.Client
	oauthCfg   *oauth2.Config
}

func NewAuthService(
	memberRepo *repositories.FamilyMemberRepository,
	jwtManager *jwtpkg.Manager,
	rdb *redis.Client,
	cfg *config.GoogleConfig,
) *AuthService {
	oauthCfg := &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURL:  cfg.RedirectURL,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
	return &AuthService{
		memberRepo: memberRepo,
		jwtManager: jwtManager,
		rdb:        rdb,
		oauthCfg:   oauthCfg,
	}
}

// Register — email/password
func (s *AuthService) Register(req RegisterRequest) (*AuthResponse, error) {
	existing, err := s.memberRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("email sudah terdaftar")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	member := &models.FamilyMember{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         "admin",
		Color:        "sky",
		AuthProvider: "email",
	}
	if err := s.memberRepo.Create(member); err != nil {
		return nil, err
	}

	return s.buildAuthResponse(member)
}

// Login — email/password
func (s *AuthService) Login(req LoginRequest) (*AuthResponse, error) {
	member, err := s.memberRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if member == nil {
		return nil, errors.New("email atau password salah")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(member.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("email atau password salah")
	}

	return s.buildAuthResponse(member)
}

// Refresh — validasi signature & expiry JWT, kembalikan token baru
func (s *AuthService) Refresh(refreshToken string) (*AuthResponse, error) {
	claims, err := s.jwtManager.Validate(refreshToken)
	if err != nil {
		return nil, errors.New("refresh token tidak valid")
	}

	member, err := s.memberRepo.GetByID(claims.UserID)
	if err != nil {
		return nil, err
	}

	return s.buildAuthResponse(member)
}

// Logout — hapus refresh token dari Redis
func (s *AuthService) Logout(userID uuid.UUID) error {
	key := fmt.Sprintf("refresh:%s", userID)
	return s.rdb.Del(context.Background(), key).Err()
}

// GoogleAuthURL — kembalikan URL consent Google
func (s *AuthService) GoogleAuthURL(state string) string {
	return s.oauthCfg.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

// GoogleCallback — tukar authorization code dengan profil Google, login/register
func (s *AuthService) GoogleCallback(ctx context.Context, code string) (*AuthResponse, error) {
	token, err := s.oauthCfg.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("gagal tukar code: %w", err)
	}

	// Ambil profil Google
	svc, err := googleOAuth.NewService(ctx, option.WithTokenSource(s.oauthCfg.TokenSource(ctx, token)))
	if err != nil {
		return nil, err
	}
	info, err := svc.Userinfo.Get().Do()
	if err != nil {
		return nil, err
	}

	// Cek by google_id dulu
	member, err := s.memberRepo.GetByGoogleID(info.Id)
	if err != nil {
		return nil, err
	}

	if member != nil {
		// Sudah ada → login langsung
		return s.buildAuthResponse(member)
	}

	// Cek by email
	member, err = s.memberRepo.GetByEmail(info.Email)
	if err != nil {
		return nil, err
	}

	if member != nil {
		// Email ada tapi belum link Google → link sekarang
		member.GoogleID = info.Id
		if member.AvatarURL == "" && info.Picture != "" {
			member.AvatarURL = info.Picture
		}
		if member.AuthProvider == "email" {
			member.AuthProvider = "both"
		}
		if err := s.memberRepo.Update(member); err != nil {
			return nil, err
		}
		return s.buildAuthResponse(member)
	}

	// Belum ada → auto register
	// Password placeholder (tidak bisa login via password)
	hash, _ := bcrypt.GenerateFromPassword([]byte(uuid.New().String()), bcrypt.DefaultCost)
	member = &models.FamilyMember{
		Name:         info.Name,
		Email:        info.Email,
		PasswordHash: string(hash),
		Role:         "admin",
		Color:        "sky",
		AvatarURL:    info.Picture,
		GoogleID:     info.Id,
		AuthProvider: "google",
	}
	if err := s.memberRepo.Create(member); err != nil {
		return nil, err
	}

	return s.buildAuthResponse(member)
}

// GetMemberByID — ambil data member berdasarkan ID
func (s *AuthService) GetMemberByID(id uuid.UUID) (*models.FamilyMember, error) {
	return s.memberRepo.GetByID(id)
}

// buildAuthResponse — buat access & refresh token, simpan refresh ke Redis
func (s *AuthService) buildAuthResponse(member *models.FamilyMember) (*AuthResponse, error) {
	familyID := uuid.Nil
	if member.FamilyID != nil {
		familyID = *member.FamilyID
	}

	accessToken, err := s.jwtManager.GenerateAccess(member.ID, familyID, member.Role)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.jwtManager.GenerateRefresh(member.ID, familyID, member.Role)
	if err != nil {
		return nil, err
	}

	// Simpan refresh token di Redis (TTL 7 hari)
	key := fmt.Sprintf("refresh:%s", member.ID)
	s.rdb.Set(context.Background(), key, refreshToken, 7*24*time.Hour)

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Member:       member,
	}, nil
}
