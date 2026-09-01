package scheduler

import (
	"fmt"
	"log"
	"time"

	"keluarga-app/backend/internal/config"
	"keluarga-app/backend/internal/models"
	"keluarga-app/backend/internal/repositories"
	"keluarga-app/backend/internal/services"

	webpush "github.com/SherClockHolmes/webpush-go"
	"github.com/robfig/cron/v3"
)

// MealNotifier mengirim push notification berisi menu hari ini ke semua keluarga
type MealNotifier struct {
	mealSvc  *services.MealPlanService
	subRepo  *repositories.PushSubscriptionRepository
	pushCfg  *config.PushConfig
}

func NewMealNotifier(
	mealSvc *services.MealPlanService,
	subRepo *repositories.PushSubscriptionRepository,
	pushCfg *config.PushConfig,
) *MealNotifier {
	return &MealNotifier{mealSvc: mealSvc, subRepo: subRepo, pushCfg: pushCfg}
}

// StartScheduler menjalankan cron job harian untuk notifikasi menu
func (n *MealNotifier) StartScheduler() {
	if n.pushCfg.VAPIDPublicKey == "" || n.pushCfg.VAPIDPrivateKey == "" {
		log.Println("[Scheduler] VAPID key belum dikonfigurasi — notifikasi meal plan dinonaktifkan")
		return
	}

	c := cron.New()
	schedule := n.pushCfg.NotificationTime
	if schedule == "" {
		schedule = "0 4 * * *" // default jam 04:00 setiap hari
	}

	_, err := c.AddFunc(schedule, func() {
		log.Println("[Scheduler] Mengirim notifikasi menu hari ini...")
		n.sendDailyNotifications()
	})
	if err != nil {
		log.Printf("[Scheduler] Gagal mendaftarkan cron job: %v", err)
		return
	}

	c.Start()
	log.Printf("[Scheduler] Meal notifier aktif — jadwal: %s", schedule)
}

// sendDailyNotifications iterasi semua family yang punya subscription dan kirim notif
func (n *MealNotifier) sendDailyNotifications() {
	familyIDs, err := n.subRepo.GetAllFamilyIDs()
	if err != nil {
		log.Printf("[Scheduler] Gagal ambil family IDs: %v", err)
		return
	}

	for _, familyID := range familyIDs {
		meals, err := n.mealSvc.GetTodayMeals(familyID)
		if err != nil {
			log.Printf("[Scheduler] Gagal ambil menu keluarga %s: %v", familyID, err)
			continue
		}

		payload := buildNotificationPayload(meals)

		subs, err := n.subRepo.GetByFamily(familyID)
		if err != nil {
			continue
		}

		for _, sub := range subs {
			n.sendToSubscription(sub, payload)
		}
	}
}

// buildNotificationPayload membuat JSON payload push notification
func buildNotificationPayload(meals []models.MealPlan) string {
	mealMap := map[models.MealType]string{}
	for _, m := range meals {
		mealMap[m.MealType] = m.Name
	}

	sarapan := mealMap[models.MealTypeBreakfast]
	if sarapan == "" { sarapan = "Belum direncanakan" }
	siang := mealMap[models.MealTypeLunch]
	if siang == "" { siang = "Belum direncanakan" }
	malam := mealMap[models.MealTypeDinner]
	if malam == "" { malam = "Belum direncanakan" }

	today := time.Now().Format("02 January 2006")
	body  := fmt.Sprintf("🌅 Sarapan: %s\n☀️ Siang: %s\n🌙 Malam: %s", sarapan, siang, malam)
	title := fmt.Sprintf("Menu Hari Ini 🍽️ — %s", today)

	// JSON format yang diparse oleh service worker
	return fmt.Sprintf(
		`{"title":%q,"body":%q,"url":"/meals"}`,
		title, body,
	)
}

// sendToSubscription mengirim push notification ke satu subscription
func (n *MealNotifier) sendToSubscription(sub models.PushSubscription, payload string) {
	resp, err := webpush.SendNotification([]byte(payload), &webpush.Subscription{
		Endpoint: sub.Endpoint,
		Keys: webpush.Keys{
			Auth:   sub.Auth,
			P256dh: sub.P256DH,
		},
	}, &webpush.Options{
		VAPIDPublicKey:  n.pushCfg.VAPIDPublicKey,
		VAPIDPrivateKey: n.pushCfg.VAPIDPrivateKey,
		Subscriber:      n.pushCfg.VAPIDSubject,
		TTL:             3600,
	})
	if err != nil {
		log.Printf("[Scheduler] Gagal kirim notif ke %s: %v", sub.Endpoint[:30], err)
		return
	}
	defer resp.Body.Close()
	log.Printf("[Scheduler] Notif terkirim ke member %s (status: %d)", sub.MemberID, resp.StatusCode)
}
