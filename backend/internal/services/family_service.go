package services

import (
	"crypto/rand"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	"keluarga-app/backend/pkg/storage"
	"strings"
	"time"
	"unicode/utf8"
)

var ErrFamilyDenied = errors.New("akses ditolak")
var ErrFamilyInvalid = errors.New("data keluarga tidak valid")
var ErrFamilyConflict = errors.New("perubahan tidak dapat dilakukan")

type CreateFamilyRequest struct {
	Name string `json:"name"`
}
type JoinFamilyRequest struct {
	InviteCode string `json:"invite_code"`
}
type UpdateMemberRequest struct {
	Name      *string           `json:"name"`
	Color     *string           `json:"color"`
	BirthDate TaskField[string] `json:"birth_date"`
	Role      *string           `json:"role"`
}
type FamilyService struct {
	familyRepo *repositories.FamilyRepository
	memberRepo *repositories.FamilyMemberRepository
	storage    storage.Storage
}

func NewFamilyService(f *repositories.FamilyRepository, m *repositories.FamilyMemberRepository, stores ...storage.Storage) *FamilyService {
	s := &FamilyService{familyRepo: f, memberRepo: m}
	if len(stores) > 0 {
		s.storage = stores[0]
	}
	return s
}
func familyName(name string) (string, error) {
	name = strings.TrimSpace(name)
	if n := utf8.RuneCountInString(name); n < 2 || n > 100 {
		return "", fmt.Errorf("%w: nama harus 2–100 karakter", ErrFamilyInvalid)
	}
	return name, nil
}
func validRole(role string) bool {
	switch role {
	case "admin", "member", "child", "view_only":
		return true
	}
	return false
}
func validMemberColor(color string) bool {
	switch color {
	case "indigo", "sky", "rose", "emerald", "amber", "violet", "orange", "teal", "pink", "blue", "green", "purple":
		return true
	}
	return false
}
func generateInviteCode() (string, error) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	for i := range b {
		b[i] = alphabet[int(b[i])%len(alphabet)]
	}
	return string(b[:4]) + "-" + string(b[4:]), nil
}
func (s *FamilyService) CreateFamily(req CreateFamilyRequest, actor uuid.UUID) (*models.Family, error) {
	name, err := familyName(req.Name)
	if err != nil {
		return nil, err
	}
	code, err := generateInviteCode()
	if err != nil {
		return nil, err
	}
	expires := time.Now().Add(7 * 24 * time.Hour)
	family := &models.Family{Name: name, InviteCode: code, InviteExpiresAt: &expires}
	err = s.memberRepo.Transaction(func(tx *gorm.DB) error {
		var member models.FamilyMember
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&member, "id = ?", actor).Error; err != nil {
			return ErrFamilyDenied
		}
		if member.FamilyID != nil {
			return fmt.Errorf("%w: kamu sudah bergabung ke keluarga", ErrFamilyConflict)
		}
		if err := tx.Create(family).Error; err != nil {
			return err
		}
		return tx.Model(&member).Updates(map[string]interface{}{"family_id": family.ID, "role": "admin"}).Error
	})
	return family, err
}
func (s *FamilyService) GetFamily(familyID, actor uuid.UUID) (*models.Family, error) {
	var member models.FamilyMember
	var family models.Family
	err := s.memberRepo.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&member, "id = ? AND family_id = ?", actor, familyID).Error; err != nil {
			return ErrFamilyDenied
		}
		return tx.First(&family, "id = ?", familyID).Error
	})
	if err == nil && member.Role != "admin" {
		family.InviteCode = ""
		family.InviteExpiresAt = nil
	}
	return &family, err
}
func (s *FamilyService) JoinFamily(req JoinFamilyRequest, actor uuid.UUID) (*models.Family, error) {
	code := strings.ToUpper(strings.TrimSpace(req.InviteCode))
	if len(code) != 9 {
		return nil, fmt.Errorf("%w: kode undangan tidak valid", ErrFamilyInvalid)
	}
	var family models.Family
	err := s.memberRepo.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("invite_code = ? AND invite_expires_at > ?", code, time.Now()).First(&family).Error; err != nil {
			return fmt.Errorf("%w: kode undangan salah atau sudah kedaluwarsa", ErrFamilyInvalid)
		}
		var member models.FamilyMember
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&member, "id = ?", actor).Error; err != nil {
			return ErrFamilyDenied
		}
		if member.FamilyID != nil {
			return fmt.Errorf("%w: kamu sudah bergabung ke keluarga", ErrFamilyConflict)
		}
		return tx.Model(&member).Updates(map[string]interface{}{"family_id": family.ID, "role": "member"}).Error
	})
	family.InviteCode = ""
	family.InviteExpiresAt = nil
	return &family, err
}
func (s *FamilyService) GetMembers(familyID uuid.UUID) ([]models.FamilyMember, error) {
	return s.memberRepo.GetByFamilyID(familyID)
}
func lockFamilyAdmin(tx *gorm.DB, familyID, actor uuid.UUID) error {
	if familyID == uuid.Nil {
		return ErrFamilyDenied
	}
	var family models.Family
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&family, "id = ?", familyID).Error; err != nil {
		return ErrFamilyDenied
	}
	var admin models.FamilyMember
	if err := tx.First(&admin, "id = ? AND family_id = ? AND role = 'admin'", actor, familyID).Error; err != nil {
		return ErrFamilyDenied
	}
	return nil
}
func protectLastAdmin(tx *gorm.DB, familyID uuid.UUID, member models.FamilyMember) error {
	if member.Role != "admin" {
		return nil
	}
	var count int64
	if err := tx.Model(&models.FamilyMember{}).Where("family_id = ? AND role = 'admin'", familyID).Count(&count).Error; err != nil {
		return err
	}
	if count <= 1 {
		return fmt.Errorf("%w: keluarga harus memiliki minimal satu admin", ErrFamilyConflict)
	}
	return nil
}
func (s *FamilyService) UpdateMember(memberID, familyID uuid.UUID, req UpdateMemberRequest, actor uuid.UUID) (*models.FamilyMember, error) {
	changes := map[string]interface{}{}
	if req.Name != nil {
		name, err := familyName(*req.Name)
		if err != nil {
			return nil, err
		}
		changes["name"] = name
	}
	if req.Color != nil {
		if !validMemberColor(*req.Color) {
			return nil, fmt.Errorf("%w: pilihan warna tidak valid", ErrFamilyInvalid)
		}
		changes["color"] = *req.Color
	}
	if req.Role != nil && !validRole(*req.Role) {
		return nil, fmt.Errorf("%w: role tidak valid", ErrFamilyInvalid)
	}
	if req.BirthDate.Present {
		changes["birth_date"] = nil
		if req.BirthDate.Value != nil {
			date := *req.BirthDate.Value
			_, err := time.Parse("2006-01-02", date)
			if err != nil || date > time.Now().In(time.FixedZone("WIB", 7*60*60)).Format("2006-01-02") {
				return nil, fmt.Errorf("%w: tanggal lahir tidak valid", ErrFamilyInvalid)
			}
			changes["birth_date"] = date
		}
	}
	var target models.FamilyMember
	err := s.memberRepo.Transaction(func(tx *gorm.DB) error {
		if familyID != uuid.Nil {
			var family models.Family
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&family, "id = ?", familyID).Error; err != nil {
				return ErrFamilyDenied
			}
		}
		var caller models.FamilyMember
		if err := tx.First(&caller, "id = ?", actor).Error; err != nil {
			return ErrFamilyDenied
		}
		if caller.FamilyID == nil {
			if familyID != uuid.Nil || memberID != actor {
				return ErrFamilyDenied
			}
		} else if *caller.FamilyID != familyID {
			return ErrFamilyDenied
		}
		if memberID != actor && caller.Role != "admin" {
			return ErrFamilyDenied
		}
		q := tx.Clauses(clause.Locking{Strength: "UPDATE"})
		if familyID != uuid.Nil {
			q = q.Where("family_id = ?", familyID)
		} else {
			q = q.Where("family_id IS NULL")
		}
		if err := q.First(&target, "id = ?", memberID).Error; err != nil {
			return ErrFamilyDenied
		}
		if req.Role != nil {
			if caller.Role != "admin" || familyID == uuid.Nil {
				return ErrFamilyDenied
			}
			if *req.Role != "admin" {
				if err := protectLastAdmin(tx, familyID, target); err != nil {
					return err
				}
			}
			changes["role"] = *req.Role
		}
		if len(changes) > 0 {
			if err := tx.Model(&target).Updates(changes).Error; err != nil {
				return err
			}
		}
		if req.Role != nil && (*req.Role == "child" || *req.Role == "view_only") {
			if err := tx.Where("member_id = ? AND family_id = ?", memberID, familyID).Delete(&models.PushSubscription{}).Error; err != nil {
				return err
			}
		}
		return tx.First(&target, "id = ?", memberID).Error
	})
	stripFamilyInvite(&target)
	return &target, err
}
func (s *FamilyService) DeleteMember(memberID, familyID, actor uuid.UUID) error {
	if memberID == actor {
		return fmt.Errorf("%w: kamu tidak dapat mengeluarkan akun sendiri", ErrFamilyConflict)
	}
	return s.memberRepo.Transaction(func(tx *gorm.DB) error {
		if err := lockFamilyAdmin(tx, familyID, actor); err != nil {
			return err
		}
		var member models.FamilyMember
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&member, "id = ? AND family_id = ?", memberID, familyID).Error; err != nil {
			return ErrFamilyDenied
		}
		if err := protectLastAdmin(tx, familyID, member); err != nil {
			return err
		}
		if err := tx.Where("member_id = ?", memberID).Delete(&models.AuthSession{}).Error; err != nil {
			return err
		}
		if err := tx.Where("member_id = ? AND family_id = ?", memberID, familyID).Delete(&models.PushSubscription{}).Error; err != nil {
			return err
		}
		return tx.Model(&member).Updates(map[string]interface{}{"family_id": nil, "role": "member"}).Error
	})
}
func (s *FamilyService) UpdateFamily(familyID, actor uuid.UUID, name string, rotate bool) (*models.Family, error) {
	var err error
	if !rotate {
		name, err = familyName(name)
		if err != nil {
			return nil, err
		}
	}
	var family models.Family
	err = s.memberRepo.Transaction(func(tx *gorm.DB) error {
		if err := lockFamilyAdmin(tx, familyID, actor); err != nil {
			return err
		}
		updates := map[string]interface{}{"name": name}
		if rotate {
			code, err := generateInviteCode()
			if err != nil {
				return err
			}
			updates = map[string]interface{}{"invite_code": code, "invite_expires_at": time.Now().Add(7 * 24 * time.Hour)}
		}
		if err := tx.Model(&models.Family{}).Where("id = ?", familyID).Updates(updates).Error; err != nil {
			return err
		}
		return tx.First(&family, "id = ?", familyID).Error
	})
	return &family, err
}
