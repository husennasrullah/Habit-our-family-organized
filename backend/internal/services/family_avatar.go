package services

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"image"
	"image/jpeg"
	_ "image/png"
	"io"
	"keluarga-app/backend/internal/models"
	"log"
	"mime/multipart"
	"time"
)

func (s *FamilyService) UploadAvatar(actor uuid.UUID, fh *multipart.FileHeader) (*models.FamilyMember, error) {
	if s.storage == nil {
		return nil, errors.New("penyimpanan foto belum tersedia")
	}
	if fh == nil || fh.Size < 1 || fh.Size > 2*1024*1024 {
		return nil, fmt.Errorf("%w: foto maksimal 2 MB", ErrFamilyInvalid)
	}
	f, err := fh.Open()
	if err != nil {
		return nil, ErrFamilyInvalid
	}
	defer f.Close()
	raw, err := io.ReadAll(io.LimitReader(f, 2*1024*1024+1))
	if err != nil || len(raw) > 2*1024*1024 {
		return nil, ErrFamilyInvalid
	}
	conf, format, err := image.DecodeConfig(bytes.NewReader(raw))
	if err != nil || (format != "jpeg" && format != "png") || conf.Width < 1 || conf.Height < 1 || conf.Width > 2048 || conf.Height > 2048 {
		return nil, fmt.Errorf("%w: gunakan JPG/PNG maksimal 2048×2048 piksel", ErrFamilyInvalid)
	}
	img, _, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return nil, ErrFamilyInvalid
	}
	bounds := img.Bounds()
	side := bounds.Dx()
	if bounds.Dy() < side {
		side = bounds.Dy()
	}
	x0, y0 := bounds.Min.X+(bounds.Dx()-side)/2, bounds.Min.Y+(bounds.Dy()-side)/2
	out := image.NewRGBA(image.Rect(0, 0, 256, 256))
	for y := 0; y < 256; y++ {
		for x := 0; x < 256; x++ {
			out.Set(x, y, img.At(x0+x*side/256, y0+y*side/256))
		}
	}
	var encoded bytes.Buffer
	if err = jpeg.Encode(&encoded, out, &jpeg.Options{Quality: 85}); err != nil {
		return nil, err
	}
	key := fmt.Sprintf("avatars/%s/%s.jpg", actor, uuid.New())
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	if _, err = s.storage.Upload(ctx, key, "image/jpeg", bytes.NewReader(encoded.Bytes()), int64(encoded.Len())); err != nil {
		return nil, errors.New("foto gagal disimpan; periksa storage dan coba lagi")
	}
	var member models.FamilyMember
	oldKey := ""
	err = s.memberRepo.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&member, "id = ?", actor).Error; err != nil {
			return ErrFamilyDenied
		}
		oldKey = member.AvatarObjectKey
		url := fmt.Sprintf("/api/v1/family/members/%s/avatar?v=%s", actor, uuid.New())
		return tx.Model(&member).Updates(map[string]interface{}{"avatar_url": url, "avatar_object_key": key}).Error
	})
	if err != nil {
		if cleanup := s.storage.Delete(ctx, key); cleanup != nil {
			log.Printf("avatar cleanup pending: member_id=%s", actor)
		}
		return nil, err
	}
	if oldKey != "" {
		if cleanup := s.storage.Delete(ctx, oldKey); cleanup != nil {
			log.Printf("old avatar cleanup pending: member_id=%s", actor)
		}
	}
	return &member, nil
}
func (s *FamilyService) Avatar(memberID, actor, familyID uuid.UUID) ([]byte, error) {
	member, err := s.memberRepo.GetByID(memberID)
	if err != nil || member == nil {
		return nil, ErrFamilyDenied
	}
	if memberID != actor && (familyID == uuid.Nil || member.FamilyID == nil || *member.FamilyID != familyID) {
		return nil, ErrFamilyDenied
	}
	if member.AvatarObjectKey == "" || s.storage == nil {
		return nil, errors.New("foto belum tersedia")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	r, _, _, err := s.storage.GetObject(ctx, member.AvatarObjectKey)
	if err != nil {
		return nil, errors.New("foto belum dapat diambil")
	}
	defer r.Close()
	data, err := io.ReadAll(io.LimitReader(r, 1024*1024))
	return data, err
}
