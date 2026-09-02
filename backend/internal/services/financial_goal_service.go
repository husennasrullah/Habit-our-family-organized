package services

import (
	"errors"

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
	if req.Title == "" {
		return nil, errors.New("judul target wajib diisi")
	}
	if req.TargetAmount <= 0 {
		return nil, errors.New("nominal target harus lebih dari 0")
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

func (s *FinancialGoalService) Update(id uuid.UUID, req UpdateGoalRequest, familyID uuid.UUID) (*models.FinancialGoal, error) {
	g, err := s.repo.GetByID(id, familyID)
	if err != nil {
		return nil, errors.New("target tidak ditemukan")
	}

	if req.Title != nil {
		g.Title = *req.Title
	}
	if req.TargetAmount != nil {
		if *req.TargetAmount <= 0 {
			return nil, errors.New("nominal target harus lebih dari 0")
		}
		g.TargetAmount = *req.TargetAmount
	}
	if req.CurrentAmount != nil {
		g.CurrentAmount = *req.CurrentAmount
	}
	if req.Deadline != nil {
		if *req.Deadline == "" {
			g.Deadline = nil
		} else {
			g.Deadline = req.Deadline
		}
	}
	if req.Notes != nil {
		g.Notes = *req.Notes
	}
	if req.IsAchieved != nil {
		g.IsAchieved = *req.IsAchieved
	}

	// Auto achieve check
	if g.CurrentAmount >= g.TargetAmount {
		g.IsAchieved = true
	}

	if err := s.repo.Update(g); err != nil {
		return nil, err
	}
	return g, nil
}

// AddFund menambahkan dana ke current_amount dan auto-set is_achieved jika sudah tercapai
func (s *FinancialGoalService) AddFund(id uuid.UUID, req AddFundRequest, familyID uuid.UUID) (*models.FinancialGoal, error) {
	if req.Amount <= 0 {
		return nil, errors.New("nominal tambah dana harus lebih dari 0")
	}

	g, err := s.repo.GetByID(id, familyID)
	if err != nil {
		return nil, errors.New("target tidak ditemukan")
	}

	g.CurrentAmount += req.Amount
	if g.CurrentAmount >= g.TargetAmount {
		g.IsAchieved = true
	}

	if err := s.repo.Update(g); err != nil {
		return nil, err
	}
	return g, nil
}

func (s *FinancialGoalService) Delete(id, familyID uuid.UUID) error {
	if _, err := s.repo.GetByID(id, familyID); err != nil {
		return errors.New("target tidak ditemukan")
	}
	return s.repo.Delete(id, familyID)
}
