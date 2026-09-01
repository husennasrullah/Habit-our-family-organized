package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PushSubscriptionRepository struct {
	db *gorm.DB
}

func NewPushSubscriptionRepository(db *gorm.DB) *PushSubscriptionRepository {
	return &PushSubscriptionRepository{db: db}
}

func (r *PushSubscriptionRepository) Upsert(s *models.PushSubscription) error {
	// Jika endpoint sudah ada, update — jika belum, buat baru
	return r.db.Where(models.PushSubscription{Endpoint: s.Endpoint}).
		Assign(models.PushSubscription{
			FamilyID: s.FamilyID,
			MemberID: s.MemberID,
			P256DH:   s.P256DH,
			Auth:     s.Auth,
		}).
		FirstOrCreate(s).Error
}

func (r *PushSubscriptionRepository) DeleteByEndpoint(endpoint string) error {
	return r.db.Where("endpoint = ?", endpoint).Delete(&models.PushSubscription{}).Error
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
