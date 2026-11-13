package repositories

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"keluarga-app/backend/internal/models"
)

var ErrPushSubscriptionOwned = errors.New("subscription sudah dimiliki akun lain; reset notifikasi browser terlebih dahulu")

type PushSubscriptionRepository struct {
	db *gorm.DB
}

func NewPushSubscriptionRepository(db *gorm.DB) *PushSubscriptionRepository {
	return &PushSubscriptionRepository{db: db}
}

func (r *PushSubscriptionRepository) Upsert(s *models.PushSubscription) error {
	result := r.db.Unscoped().Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "endpoint"}},
		DoUpdates: clause.Assignments(map[string]interface{}{"p256_dh": s.P256DH, "auth": s.Auth, "deleted_at": nil, "updated_at": time.Now()}),
		Where:     clause.Where{Exprs: []clause.Expression{clause.Expr{SQL: "push_subscriptions.family_id = ? AND push_subscriptions.member_id = ?", Vars: []interface{}{s.FamilyID, s.MemberID}}}},
	}).Create(s)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrPushSubscriptionOwned
	}
	return nil
}

func (r *PushSubscriptionRepository) DeleteByEndpoint(endpoint string, familyID, memberID uuid.UUID) error {
	return r.db.Where("endpoint = ? AND family_id = ? AND member_id = ?", endpoint, familyID, memberID).Delete(&models.PushSubscription{}).Error
}

// GetByFamily mengambil semua subscription aktif dalam satu keluarga
func (r *PushSubscriptionRepository) GetByFamily(familyID uuid.UUID) ([]models.PushSubscription, error) {
	var subs []models.PushSubscription
	if err := r.db.Where("family_id = ?", familyID).Find(&subs).Error; err != nil {
		return nil, err
	}
	return subs, nil
}

// GetAllFamilyIDs mengembalikan daftar unik family_id yang punya subscription
func (r *PushSubscriptionRepository) GetAllFamilyIDs() ([]uuid.UUID, error) {
	var ids []uuid.UUID
	if err := r.db.Model(&models.PushSubscription{}).
		Distinct("family_id").
		Pluck("family_id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}

func (r *PushSubscriptionRepository) IsSubscribed(endpoint string, familyID, memberID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.PushSubscription{}).Where("endpoint = ? AND family_id = ? AND member_id = ?", endpoint, familyID, memberID).Count(&count).Error
	return count > 0, err
}
