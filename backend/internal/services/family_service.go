package services

import (
	"errors"
	"fmt"
	"math/rand"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"

	"github.com/google/uuid"
)

// ─── DTOs ─────────────────────────────────────────────────────────────────────

type CreateFamilyRequest struct {
	Name string `json:"name" validate:"required,min=2"`
}

type JoinFamilyRequest struct {
	InviteCode string `json:"invite_code" validate:"required"`
}

type UpdateMemberRequest struct {
	Name      string  `json:"name"`
	Color     string  `json:"color"`
	BirthDate *string `json:"birth_date"`
	Role      string  `json:"role"`
}

// ─── Service ──────────────────────────────────────────────────────────────────

type FamilyService struct {
	familyRepo *repositories.FamilyRepository
	memberRepo *repositories.FamilyMemberRepository
}

func NewFamilyService(
	familyRepo *repositories.FamilyRepository,
	memberRepo *repositories.FamilyMemberRepository,
) *FamilyService {
	return &FamilyService{familyRepo: familyRepo, memberRepo: memberRepo}
}

// CreateFamily — buat keluarga baru, jadikan member sebagai admin
func (s *FamilyService) CreateFamily(req CreateFamilyRequest, memberID uuid.UUID) (*models.Family, error) {
	member, err := s.memberRepo.GetByID(memberID)
	if err != nil || member == nil {
		return nil, errors.New("member tidak ditemukan")
	}
	if member.FamilyID != nil {
		return nil, errors.New("kamu sudah bergabung ke sebuah keluarga")
	}

	family := &models.Family{
		Name:       req.Name,
		InviteCode: generateInviteCode(),
	}
	if err := s.familyRepo.Create(family); err != nil {
		return nil, err
	}

	member.FamilyID = &family.ID
	member.Role = "admin"
	if err := s.memberRepo.Update(member); err != nil {
		return nil, err
	}

	return family, nil
}

// GetFamily — ambil detail keluarga (hanya member yang bergabung)
func (s *FamilyService) GetFamily(familyID uuid.UUID) (*models.Family, error) {
	return s.familyRepo.GetByID(familyID)
}

// JoinFamily — gabung ke keluarga via invite code
func (s *FamilyService) JoinFamily(req JoinFamilyRequest, memberID uuid.UUID) (*models.Family, error) {
	member, err := s.memberRepo.GetByID(memberID)
	if err != nil || member == nil {
		return nil, errors.New("member tidak ditemukan")
	}
	if member.FamilyID != nil {
		return nil, errors.New("kamu sudah bergabung ke sebuah keluarga")
	}

	family, err := s.familyRepo.GetByInviteCode(req.InviteCode)
	if err != nil {
		return nil, err
	}
	if family == nil {
		return nil, errors.New("invite code tidak valid")
	}

	member.FamilyID = &family.ID
	member.Role = "member"
	if err := s.memberRepo.Update(member); err != nil {
		return nil, err
	}

	return family, nil
}

// GetMembers — daftar anggota keluarga
func (s *FamilyService) GetMembers(familyID uuid.UUID) ([]models.FamilyMember, error) {
	return s.memberRepo.GetByFamilyID(familyID)
}

// UpdateMember — update profil anggota (admin bisa ubah role, member hanya diri sendiri)
func (s *FamilyService) UpdateMember(memberID, familyID uuid.UUID, req UpdateMemberRequest, callerRole string) (*models.FamilyMember, error) {
	member, err := s.memberRepo.GetByID(memberID)
	if err != nil || member == nil {
		return nil, errors.New("member tidak ditemukan")
	}

	// Pastikan member ada di family yang sama
	if member.FamilyID == nil || *member.FamilyID != familyID {
		return nil, errors.New("akses ditolak")
	}

	if req.Name != "" {
		member.Name = req.Name
	}
	if req.Color != "" {
		member.Color = req.Color
	}
	if req.BirthDate != nil {
		member.BirthDate = req.BirthDate
	}
	// Hanya admin yang boleh ganti role
	if req.Role != "" && callerRole == "admin" {
		member.Role = req.Role
	}

	if err := s.memberRepo.Update(member); err != nil {
		return nil, err
	}

	return member, nil
}

// DeleteMember — hapus anggota dari keluarga (admin only)
func (s *FamilyService) DeleteMember(memberID, familyID uuid.UUID) error {
	return s.memberRepo.DeleteByID(memberID, familyID)
}

// generateInviteCode — 8-karakter uppercase alphanumeric
func generateInviteCode() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 8)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return fmt.Sprintf("%s-%s", string(b[:4]), string(b[4:]))
}
