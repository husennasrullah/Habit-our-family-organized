package repositories

import (
	"keluarga-app/backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type KidsRepository struct{ db *gorm.DB }

func NewKidsRepository(db *gorm.DB) *KidsRepository { return &KidsRepository{db: db} }

// Every write locks the parent first, including deletion and birth-date corrections.
// This keeps child records, ownership checks and concurrent edits in one transaction.
func (r *KidsRepository) WithKid(id, familyID uuid.UUID, fn func(*KidsRepository, *models.KidProfile) error) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var kid models.KidProfile
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND family_id = ?", id, familyID).First(&kid).Error; err != nil {
			return err
		}
		return fn(&KidsRepository{db: tx}, &kid)
	})
}
func (r *KidsRepository) CreateKid(k *models.KidProfile) error { return r.db.Create(k).Error }
func (r *KidsRepository) GetKidsByFamily(familyID uuid.UUID) ([]models.KidProfile, error) {
	list := make([]models.KidProfile, 0)
	err := r.db.Where("family_id = ?", familyID).Order("birth_date ASC, id ASC").Find(&list).Error
	return list, err
}
func (r *KidsRepository) GetKidByID(id, familyID uuid.UUID) (*models.KidProfile, error) {
	var k models.KidProfile
	err := r.db.Where("id = ? AND family_id = ?", id, familyID).First(&k).Error
	return &k, err
}
func (r *KidsRepository) UpdateKid(k *models.KidProfile) error {
	result := r.db.Model(&models.KidProfile{}).Where("id = ? AND family_id = ?", k.ID, k.FamilyID).Select("name", "gender", "birth_date", "notes", "updated_at").Updates(k)
	return affected(result)
}
func affected(result *gorm.DB) error {
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
func (r *KidsRepository) DeleteKid(id, familyID uuid.UUID) error {
	for _, record := range []interface{}{&models.GrowthRecord{}, &models.VaccineRecord{}, &models.Milestone{}, &models.HealthRecord{}} {
		if err := r.db.Where("kid_id = ?", id).Delete(record).Error; err != nil {
			return err
		}
	}
	return affected(r.db.Where("id = ? AND family_id = ?", id, familyID).Delete(&models.KidProfile{}))
}

// These record helpers are used only inside WithKid after the family and parent row were checked.
func (r *KidsRepository) CreateRecord(record interface{}) error { return r.db.Create(record).Error }
func (r *KidsRepository) GetRecord(id, kidID uuid.UUID, record interface{}) error {
	return r.db.Where("id = ? AND kid_id = ?", id, kidID).First(record).Error
}
func (r *KidsRepository) UpdateRecord(id, kidID uuid.UUID, record interface{}) error {
	return affected(r.db.Model(record).Where("id = ? AND kid_id = ?", id, kidID).Select("*").Omit("id", "kid_id", "created_at", "deleted_at").Updates(record))
}
func (r *KidsRepository) DeleteRecord(id, kidID uuid.UUID, record interface{}) error {
	return affected(r.db.Where("id = ? AND kid_id = ?", id, kidID).Delete(record))
}
func (r *KidsRepository) ListRecords(kidID, familyID uuid.UUID, out interface{}, order string) error {
	parent := r.db.Model(&models.KidProfile{}).Select("id").Where("id = ? AND family_id = ?", kidID, familyID)
	return r.db.Where("kid_id IN (?)", parent).Order(order).Find(out).Error
}

// Reject a birth-date correction that would put existing history before birth.
func (r *KidsRepository) HasHistoryBefore(kidID uuid.UUID, birth string) (bool, error) {
	for _, item := range []struct {
		model  interface{}
		column string
	}{
		{&models.GrowthRecord{}, "date"}, {&models.HealthRecord{}, "date"},
		{&models.VaccineRecord{}, "scheduled_date"}, {&models.VaccineRecord{}, "given_date"},
		{&models.Milestone{}, "achieved_at"},
	} {
		var count int64
		if err := r.db.Model(item.model).Where("kid_id = ? AND "+item.column+" < ?", kidID, birth).Count(&count).Error; err != nil {
			return false, err
		}
		if count > 0 {
			return true, nil
		}
	}
	return false, nil
}
