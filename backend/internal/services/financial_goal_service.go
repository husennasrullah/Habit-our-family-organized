package services

import (
	"errors"
	"strings"

	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"

	"github.com/google/uuid"
)

// ─── DTOs ────────────────────────────────────────────────────────────────────

type CreateGoalRequest struct {
	Title         string  `json:"title"          validate:"required"`
	TargetAmount  float64 `json:"target_amount"  validate:"required"`
	CurrentAmount float64 `json:"current_amount"`
	Deadline      *string `json:"deadline"`
	Notes         string  `json:"notes"`
}

type UpdateGoalRequest struct {
	Title         *string  `json:"title"`
	TargetAmount  *float64 `json:"target_amount"`
	CurrentAmount *float64 `json:"current_amount"`
	Deadline      *string  `json:"deadline"`
	Notes         *string  `json:"notes"`
	IsAchieved    *bool    `json:"is_achieved"`
}

type AddFundRequest struct {
	Note   string  `json:"note"`
	Amount float64 `json:"amount" validate:"required"`
}

// ─── Service ─────────────────────────────────────────────────────────────────

type FinancialGoalService struct {
	repo *repositories.FinancialGoalRepository
}

func NewFinancialGoalService(repo *repositories.FinancialGoalRepository) *FinancialGoalService {
	return &FinancialGoalService{repo: repo}
}

func (s *FinancialGoalService) Create(req CreateGoalRequest, familyID, userID uuid.UUID) (*models.FinancialGoal, error) {
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		return nil, errors.New("judul target wajib diisi")
	}
	if !validMoney(req.TargetAmount, false) {
		return nil, errors.New("nominal target harus lebih dari 0")
	}

	if !validMoney(req.CurrentAmount, true) {
		return nil, errors.New("saldo awal tidak valid")
	}
	if req.Deadline != nil && *req.Deadline != "" && !validDate(*req.Deadline) {
		return nil, errors.New("tanggal tidak valid")
	}
	if req.Deadline != nil && *req.Deadline == "" {
		req.Deadline = nil
	}
	g := &models.FinancialGoal{
		FamilyID:      familyID,
		CreatedBy:     userID,
		Title:         req.Title,
		TargetAmount:  req.TargetAmount,
		CurrentAmount: req.CurrentAmount,
		Deadline:      req.Deadline,
		Notes:         req.Notes,
	}
	// Auto achieve jika current sudah >= target saat dibuat
	if g.CurrentAmount >= g.TargetAmount {
		g.IsAchieved = true
	}

	if err := s.repo.Create(g); err != nil {
		return nil, err
	}
	return g, nil
}

func (s *FinancialGoalService) GetList(familyID uuid.UUID) ([]models.FinancialGoal, error) {
	return s.repo.GetByFamily(familyID)
}

func (s *FinancialGoalService) Update(id uuid.UUID, req UpdateGoalRequest, familyID, userID uuid.UUID) (*models.FinancialGoal, error) {
	return s.repo.Mutate(id, familyID, userID, "adjustment", "Koreksi saldo", func(g *models.FinancialGoal) error {
		if req.Title != nil {
			g.Title = strings.TrimSpace(*req.Title)
			if g.Title == "" {
				return errors.New("judul target wajib diisi")
			}
		}
		if req.TargetAmount != nil {
			if !validMoney(*req.TargetAmount, false) {
				return errors.New("nominal target tidak valid")
			}
			g.TargetAmount = *req.TargetAmount
		}
		if req.CurrentAmount != nil {
			if !validMoney(*req.CurrentAmount, true) {
				return errors.New("saldo tidak valid")
			}
			g.CurrentAmount = *req.CurrentAmount
		}
		if req.Deadline != nil {
			if *req.Deadline == "" {
				g.Deadline = nil
			} else {
				if !validDate(*req.Deadline) {
					return errors.New("tanggal tidak valid")
				}
				g.Deadline = req.Deadline
			}
		}
		if req.Notes != nil {
			g.Notes = *req.Notes
		}
		return nil
	})
}
func (s *FinancialGoalService) AddFund(id uuid.UUID, req AddFundRequest, familyID, userID uuid.UUID) (*models.FinancialGoal, error) {
	if !validMoney(req.Amount, false) {
		return nil, errors.New("nominal tambah dana tidak valid")
	}
	return s.repo.Mutate(id, familyID, userID, "deposit", strings.TrimSpace(req.Note), func(g *models.FinancialGoal) error {
		if !validMoney(g.CurrentAmount+req.Amount, true) {
			return errors.New("saldo melebihi batas nominal")
		}
		g.CurrentAmount = roundMoney(g.CurrentAmount + req.Amount)
		return nil
	})
}
func (s *FinancialGoalService) Entries(id, familyID uuid.UUID) ([]models.FinancialGoalEntry, error) {
	return s.repo.Entries(id, familyID)
}

func (s *FinancialGoalService) Delete(id, familyID uuid.UUID) error {
	if _, err := s.repo.GetByID(id, familyID); err != nil {
		return errors.New("target tidak ditemukan")
	}
	return s.repo.Delete(id, familyID)
}
