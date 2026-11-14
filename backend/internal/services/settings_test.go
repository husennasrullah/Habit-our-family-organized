package services

import (
	"bytes"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"image"
	"image/color"
	"image/png"
	"keluarga-app/backend/internal/config"
	"keluarga-app/backend/internal/middleware"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	jwtpkg "keluarga-app/backend/pkg/jwt"
	"net/http/httptest"
	"os"
	"sync"
	"testing"
	"time"
)

func settingsDB(t *testing.T) *gorm.DB {
	db := financeDB(t)
	if err := db.AutoMigrate(&models.Family{}, &models.FamilyMember{}, &models.AuthSession{}, &models.PushSubscription{}); err != nil {
		t.Fatal(err)
	}
	return db
}
func createSettingMember(t *testing.T, db *gorm.DB, family *uuid.UUID, role string) models.FamilyMember {
	t.Helper()
	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.MinCost)
	m := models.FamilyMember{FamilyID: family, Name: "Member", Email: uuid.NewString() + "@example.test", Role: role, PasswordHash: string(hash), Color: "sky", AuthProvider: "email"}
	if err := db.Create(&m).Error; err != nil {
		t.Fatal(err)
	}
	return m
}
func TestSettingsPermissionsAndLastAdmin(t *testing.T) {
	db := settingsDB(t)
	members := repositories.NewFamilyMemberRepository(db)
	svc := NewFamilyService(repositories.NewFamilyRepository(db), members)
	a := createSettingMember(t, db, nil, "admin")
	f, err := svc.CreateFamily(CreateFamilyRequest{Name: " Keluarga QA "}, a.ID)
	if err != nil {
		t.Fatal(err)
	}
	b := createSettingMember(t, db, &f.ID, "member")
	other := createSettingMember(t, db, nil, "admin")
	of, err := svc.CreateFamily(CreateFamilyRequest{Name: "Other"}, other.ID)
	if err != nil {
		t.Fatal(err)
	}
	name := "Nama baru"
	if _, err = svc.UpdateMember(a.ID, f.ID, UpdateMemberRequest{Name: &name}, b.ID); err == nil {
		t.Fatal("non-admin changed someone else")
	}
	if _, err = svc.UpdateMember(other.ID, f.ID, UpdateMemberRequest{Name: &name}, a.ID); err == nil {
		t.Fatal("foreign target accepted")
	}
	if _, err = svc.UpdateMember(b.ID, f.ID, UpdateMemberRequest{Name: &name}, other.ID); err == nil {
		t.Fatal("foreign actor accepted")
	}
	if _, err = svc.UpdateMember(b.ID, f.ID, UpdateMemberRequest{Name: &name, BirthDate: TaskField[string]{Present: true}}, b.ID); err != nil {
		t.Fatal(err)
	}
	memberRole := "member"
	if _, err = svc.UpdateMember(a.ID, f.ID, UpdateMemberRequest{Role: &memberRole}, a.ID); err == nil {
		t.Fatal("last admin demoted")
	}
	if err = svc.DeleteMember(a.ID, f.ID, a.ID); err == nil {
		t.Fatal("self removed")
	}
	invalidRole := "owner"
	if _, err = svc.UpdateMember(b.ID, f.ID, UpdateMemberRequest{Role: &invalidRole}, a.ID); err == nil {
		t.Fatal("bad role")
	}
	badColor := "javascript"
	if _, err = svc.UpdateMember(b.ID, f.ID, UpdateMemberRequest{Color: &badColor}, a.ID); err == nil {
		t.Fatal("bad color")
	}
	if _, err = svc.UpdateFamily(f.ID, b.ID, "New", false); err == nil {
		t.Fatal("nonadmin renamed family")
	}
	public, err := svc.GetFamily(f.ID, b.ID)
	if err != nil || public.InviteCode != "" {
		t.Fatal("invite exposed")
	}
	old := f.InviteCode
	f, err = svc.UpdateFamily(f.ID, a.ID, "", true)
	if err != nil || f.InviteCode == old {
		t.Fatal("rotation failed")
	}
	joiner := createSettingMember(t, db, nil, "admin")
	if _, err = svc.JoinFamily(JoinFamilyRequest{InviteCode: old}, joiner.ID); err == nil {
		t.Fatal("old invite accepted")
	}
	if _, err = svc.JoinFamily(JoinFamilyRequest{InviteCode: f.InviteCode}, joiner.ID); err != nil {
		t.Fatal(err)
	}
	past := time.Now().Add(-time.Hour)
	db.Model(f).Update("invite_expires_at", past)
	late := createSettingMember(t, db, nil, "admin")
	if _, err = svc.JoinFamily(JoinFamilyRequest{InviteCode: f.InviteCode}, late.ID); err == nil {
		t.Fatal("expired invite accepted")
	}
	// Two admins concurrently demote themselves: family lock must retain one.
	adminRole := "admin"
	if _, err = svc.UpdateMember(b.ID, f.ID, UpdateMemberRequest{Role: &adminRole}, a.ID); err != nil {
		t.Fatal(err)
	}
	var wg sync.WaitGroup
	for _, id := range []uuid.UUID{a.ID, b.ID} {
		wg.Add(1)
		go func(id uuid.UUID) {
			defer wg.Done()
			_, _ = svc.UpdateMember(id, f.ID, UpdateMemberRequest{Role: &memberRole}, id)
		}(id)
	}
	wg.Wait()
	var count int64
	db.Model(&models.FamilyMember{}).Where("family_id = ? AND role = 'admin'", f.ID).Count(&count)
	if count != 1 {
		t.Fatal("lost final admin", count)
	}
	_ = of
	// SQL migration is additive and repeatable.
	sql, err := os.ReadFile("../../migrations/014_account_sessions.sql")
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 2; i++ {
		if err = db.Exec(string(sql)).Error; err != nil {
			t.Fatal(err)
		}
	}
}
func TestSettingsSessionsLogoutAndRemoval(t *testing.T) {
	db := settingsDB(t)
	repo := repositories.NewFamilyMemberRepository(db)
	manager := jwtpkg.NewManager("session-test-key", 15*time.Minute, 7*24*time.Hour)
	auth := NewAuthService(repo, manager, nil, &config.GoogleConfig{})
	familySvc := NewFamilyService(repositories.NewFamilyRepository(db), repo)
	admin := createSettingMember(t, db, nil, "admin")
	family, err := familySvc.CreateFamily(CreateFamilyRequest{Name: "Sesi"}, admin.ID)
	if err != nil {
		t.Fatal(err)
	}
	member := createSettingMember(t, db, &family.ID, "member")
	login, err := auth.Login(LoginRequest{Email: member.Email, Password: "password123"})
	if err != nil {
		t.Fatal(err)
	}
	second, err := auth.Login(LoginRequest{Email: member.Email, Password: "password123"})
	if err != nil {
		t.Fatal(err)
	}
	firstClaims, _ := manager.Validate(login.AccessToken)
	secondClaims, _ := manager.Validate(second.AccessToken)
	if _, err = auth.Refresh(login.AccessToken); err == nil {
		t.Fatal("access used as refresh")
	}
	refreshClaims, _ := manager.Validate(login.RefreshToken)
	if _, err = auth.ValidateSession(refreshClaims); err == nil {
		t.Fatal("refresh used as access")
	}
	if _, err = auth.Refresh(login.RefreshToken); err != nil {
		t.Fatal(err)
	}
	// Role from a still-valid token must immediately reflect current database role.
	role := "view_only"
	if _, err = familySvc.UpdateMember(member.ID, family.ID, UpdateMemberRequest{Role: &role}, admin.ID); err != nil {
		t.Fatal(err)
	}
	current, err := auth.ValidateSession(firstClaims)
	if err != nil || current.Role != "view_only" {
		t.Fatal("stale role accepted", err)
	}
	if err = auth.LogoutSession(member.ID, firstClaims.SessionID, ""); err != nil {
		t.Fatal(err)
	}
	if _, err = auth.Refresh(login.RefreshToken); err == nil {
		t.Fatal("logged-out refresh accepted")
	}
	if _, err = auth.ValidateSession(firstClaims); err == nil {
		t.Fatal("logged-out access accepted")
	}
	if _, err = auth.ValidateSession(secondClaims); err != nil {
		t.Fatal("other device revoked", err)
	}
	if err = auth.ChangePassword(member.ID, secondClaims.SessionID, "wrong", "newpassword123"); err == nil {
		t.Fatal("wrong old password")
	}
	third, err := auth.Login(LoginRequest{Email: member.Email, Password: "password123"})
	if err != nil {
		t.Fatal(err)
	}
	if err = auth.ChangePassword(member.ID, secondClaims.SessionID, "password123", "newpassword123"); err != nil {
		t.Fatal(err)
	}
	if _, err = auth.Refresh(third.RefreshToken); err == nil {
		t.Fatal("other login survived password change")
	}
	if _, err = auth.ValidateSession(secondClaims); err != nil {
		t.Fatal("current session lost", err)
	}
	if err = familySvc.DeleteMember(member.ID, family.ID, admin.ID); err != nil {
		t.Fatal(err)
	}
	if _, err = auth.ValidateSession(secondClaims); err == nil {
		t.Fatal("removed member session valid")
	}
	detached, err := repo.GetByID(member.ID)
	if err != nil || detached.FamilyID != nil {
		t.Fatal("account deleted instead of detached", err)
	}
	if _, err = auth.Login(LoginRequest{Email: member.Email, Password: "newpassword123"}); err != nil {
		t.Fatal("detached user cannot login", err)
	}
}
func TestSettingsAvatar(t *testing.T) {
	db := settingsDB(t)
	repo := repositories.NewFamilyMemberRepository(db)
	store := &documentTestStorage{files: map[string][]byte{}}
	svc := NewFamilyService(repositories.NewFamilyRepository(db), repo, store)
	m := createSettingMember(t, db, nil, "member")
	img := image.NewRGBA(image.Rect(0, 0, 16, 16))
	img.Set(0, 0, color.White)
	var pngBytes bytes.Buffer
	png.Encode(&pngBytes, img)
	updated, err := svc.UploadAvatar(m.ID, documentFile(t, "avatar.png", pngBytes.String()))
	if err != nil {
		t.Fatal(err)
	}
	if updated.AvatarURL == "" {
		t.Fatal("avatar URL missing")
	}
	data, err := svc.Avatar(m.ID, m.ID, uuid.Nil)
	if err != nil || len(data) == 0 {
		t.Fatal("avatar read failed", err)
	}
	if _, err = svc.Avatar(m.ID, uuid.New(), uuid.Nil); err == nil {
		t.Fatal("foreign avatar access")
	}
	if _, err = svc.UploadAvatar(m.ID, documentFile(t, "bad.png", "not an image")); err == nil {
		t.Fatal("spoof avatar accepted")
	}
}

func TestSettingsHTTPTokenBoundaries(t *testing.T) {
	db := settingsDB(t)
	repo := repositories.NewFamilyMemberRepository(db)
	manager := jwtpkg.NewManager("http-test", time.Minute, time.Hour)
	auth := NewAuthService(repo, manager, nil, &config.GoogleConfig{})
	m := createSettingMember(t, db, nil, "member")
	login, err := auth.Login(LoginRequest{Email: m.Email, Password: "password123"})
	if err != nil {
		t.Fatal(err)
	}
	app := fiber.New()
	app.Get("/guard", middleware.AuthMiddlewareWithManager(manager, auth.ValidateSession), func(c *fiber.Ctx) error { return c.SendString(c.Locals("role").(string)) })
	request := func(token string, want int, role string) {
		t.Helper()
		r := httptest.NewRequest("GET", "/guard", nil)
		r.Header.Set("Authorization", "Bearer "+token)
		res, err := app.Test(r)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		if res.StatusCode != want {
			t.Fatalf("got %d want %d", res.StatusCode, want)
		}
		if role != "" {
			var b bytes.Buffer
			b.ReadFrom(res.Body)
			if b.String() != role {
				t.Fatal("stale role", b.String())
			}
		}
	}
	request(login.RefreshToken, 401, "")
	request(login.AccessToken, 200, "member")
	db.Model(&m).Update("role", "child")
	request(login.AccessToken, 200, "child")
	claims, _ := manager.Validate(login.AccessToken)
	if err = auth.LogoutSession(m.ID, claims.SessionID, ""); err != nil {
		t.Fatal(err)
	}
	request(login.AccessToken, 401, "")
}
