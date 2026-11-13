# Fitur Jadwal Makanan (Meal Plan) — Plan

## Overview

Menambahkan modul **Jadwal Makanan** ke aplikasi Kenangan Keluarga. User bisa merencanakan menu masakan harian keluarga dalam tampilan grid mingguan (7 hari × 3 waktu makan). Setiap slot berisi nama masakan, catatan singkat, dan link resep opsional. Dilengkapi **push notification PWA** setiap pagi yang menampilkan menu hari ini.

### Scope
- Backend: model, repository, service, handler, route
- Frontend: halaman baru `/meals`, hook, types, sidebar entry
- Push notification: VAPID setup backend + service worker frontend + scheduler harian

### Non-Goals
- Tidak ada integrasi dengan Shopping List / Budget (fitur ini berdiri sendiri)
- Tidak ada fitur kalkulasi kalori / nutrisi
- Tidak ada fitur import/export resep dari website lain

---

## Sub-Tasks

---

### Task MP-1 — Backend: Model & Migrasi

**Intent:**
Mendefinisikan struktur data untuk meal plan di database. Satu `MealPlan` merepresentasikan satu slot waktu makan (sarapan/siang/malam) pada tanggal tertentu untuk satu keluarga.

**Expected Outcomes:**
- Tabel `meal_plans` terbuat otomatis via GORM AutoMigrate
- Model terdaftar di `migrate.go`
- Build backend tetap berhasil (`go build ./...`)

**Todo List:**
- [x] Buat file `backend/internal/models/meal_plan.go`
- [x] Definisikan struct `MealPlan` dengan field:
  - `BaseModel` (embed — ID UUID, CreatedAt, UpdatedAt, DeletedAt)
  - `FamilyID uuid.UUID` (wajib, indexed)
  - `CreatedBy uuid.UUID` (user yang menambahkan)
  - `Date string` (format `YYYY-MM-DD`, tanggal slot ini)
  - `MealType string` (enum: `breakfast` | `lunch` | `dinner`)
  - `Name string` (nama masakan, wajib)
  - `Notes string` (catatan singkat, opsional)
  - `RecipeURL string` (link resep, opsional)
- [x] Tambahkan `&models.MealPlan{}` ke daftar AutoMigrate di `backend/internal/database/migrate.go`
- [x] Jalankan `go build ./...` untuk validasi

**Relevant Context:**
- Pola model: `backend/internal/models/task.go`
- BaseModel: `backend/internal/models/base.go`
- Migrasi: `backend/internal/database/migrate.go`

**Status:** `[x] implemented`

---

### Task MP-2 — Backend: Repository & Service

**Intent:**
Membuat lapisan data access dan business logic untuk meal plan. Mendukung query per minggu/bulan agar frontend bisa menampilkan grid mingguan.

**Expected Outcomes:**
- CRUD meal plan berfungsi dengan isolasi `family_id`
- Query per rentang tanggal (seminggu/sebulan) tersedia
- Build backend tetap berhasil

**Todo List:**
- [x] Buat file `backend/internal/repositories/meal_plan_repo.go`
- [x] Implementasi method repository:
  - `Create(m *models.MealPlan) error`
  - `GetByID(id, familyID uuid.UUID) (*models.MealPlan, error)`
  - `GetByDateRange(familyID uuid.UUID, from, to string) ([]models.MealPlan, error)` — untuk query mingguan/bulanan
  - `GetByDate(familyID uuid.UUID, date string) ([]models.MealPlan, error)` — untuk notifikasi harian
  - `Update(m *models.MealPlan) error`
  - `Delete(id, familyID uuid.UUID) error`
- [x] Buat file `backend/internal/services/meal_plan_service.go`
- [x] Definisikan DTOs di service:
  - `CreateMealPlanRequest` (date, meal_type, name, notes, recipe_url)
  - `UpdateMealPlanRequest` (name, notes, recipe_url)
  - `GetMealPlansRequest` (from, to — tanggal range)
- [x] Implementasi method service:
  - `Create(req, familyID, createdBy)` — validasi meal_type harus salah satu dari 3 pilihan
  - `GetByDateRange(req, familyID)`
  - `GetTodayMeals(familyID)` — dipakai scheduler notifikasi
  - `Update(id, req, familyID)`
  - `Delete(id, familyID)`
- [x] Jalankan `go build ./...` untuk validasi

**Relevant Context:**
- Pola repository: `backend/internal/repositories/task_repo.go`
- Pola service: `backend/internal/services/task_service.go`

**Status:** `[x] implemented`

---

### Task MP-3 — Backend: Handler & Routes

**Intent:**
Membuat HTTP endpoints untuk meal plan dan mendaftarkan ke router Fiber. Semua endpoint dilindungi auth middleware.

**Expected Outcomes:**
- 5 endpoint tersedia dan bisa ditest via curl/Postman
- `family_id` selalu diambil dari JWT context, bukan input user
- Response format konsisten `{data, message}`

**Todo List:**
- [x] Buat file `backend/internal/handlers/meal_plan_handler.go`
- [x] Implementasi handler methods:
  - `GetMealPlans` — `GET /meal-plans?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - `CreateMealPlan` — `POST /meal-plans`
  - `UpdateMealPlan` — `PUT /meal-plans/:id`
  - `DeleteMealPlan` — `DELETE /meal-plans/:id`
- [x] Tambahkan ke `backend/cmd/main.go`:
  - Inisialisasi `mealPlanRepo`, `mealPlanService`, `mealPlanHandler`
  - Daftarkan route group `/meal-plans` dengan `authMw`
- [x] Jalankan `go build ./...` untuk validasi

**Relevant Context:**
- Pola handler: `backend/internal/handlers/task_handler.go`
- Registrasi route & DI: `backend/cmd/main.go` lines 50–83 dan 132–138
- Helper `getUserID` dan `getFamilyID`: `backend/internal/handlers/family_handler.go`

**Status:** `[x] implemented`

---

### Task MP-4 — Backend: Push Notification (VAPID + Scheduler)

**Intent:**
Menambahkan infrastruktur push notification berbasis Web Push (VAPID) dan scheduler harian yang mengirim notifikasi menu hari ini ke semua anggota keluarga setiap pagi.

**Expected Outcomes:**
- Backend bisa menerima dan menyimpan push subscription dari browser
- Scheduler berjalan setiap hari pagi (default jam 04:00 WIB) dan mengirim notifikasi ke semua subscriber aktif
- VAPID key dikonfigurasi via `.env`

**Todo List:**
- [x] Tambahkan library `github.com/SherClockHolmes/webpush-go` ke `go.mod`
- [x] Tambahkan library `github.com/robfig/cron/v3` ke `go.mod` untuk scheduler
- [x] Tambahkan `PushConfig` ke `backend/internal/config/config.go`:
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `VAPID_SUBJECT` (contoh: `mailto:admin@keluarga.dev`)
  - `NOTIFICATION_TIME` (format cron, default: `0 4 * * *` = jam 04:00 setiap hari)
- [x] Tambahkan ke `.env.example`
- [x] Buat model `PushSubscription` (`backend/internal/models/push_subscription.go`):
  - `FamilyID`, `MemberID`, `Endpoint`, `P256DH`, `Auth`
- [x] Buat handler `POST /push/subscribe` — simpan subscription dari browser
- [x] Buat handler `DELETE /push/subscribe` — hapus subscription (unsubscribe)
- [x] Buat file `backend/internal/scheduler/meal_notifier.go`:
  - Fungsi `SendDailyMealNotification(familyID)` — ambil menu hari ini, format pesan, kirim ke semua subscriber keluarga
  - Fungsi `StartScheduler(cfg, db)` — jalankan cron job
- [x] Panggil `scheduler.StartScheduler()` di `backend/cmd/main.go` setelah AutoMigrate
- [x] Jalankan `go build ./...` untuk validasi

**Relevant Context:**
- Config pattern: `backend/internal/config/config.go`
- Main entry point: `backend/cmd/main.go`
- MealPlanService.GetTodayMeals() dari Task MP-2

**Status:** `[x] implemented`

---

### Task MP-5 — Frontend: Types, Hook & API

**Intent:**
Mendefinisikan TypeScript types untuk meal plan dan membuat React Query hooks yang akan dipakai halaman.

**Expected Outcomes:**
- Types `MealPlan`, `MealType`, `CreateMealPlanPayload` tersedia di `types/index.ts`
- Hook `useMealPlans`, `useCreateMealPlan`, `useUpdateMealPlan`, `useDeleteMealPlan` tersedia
- TypeScript tidak ada error (`npx tsc --noEmit`)

**Todo List:**
- [x] Tambahkan types ke `frontend/types/index.ts`:
  ```ts
  export type MealType = "breakfast" | "lunch" | "dinner";
  export interface MealPlan {
    id: string;
    family_id: string;
    created_by: string;
    date: string;         // YYYY-MM-DD
    meal_type: MealType;
    name: string;
    notes: string;
    recipe_url: string;
    created_at: string;
    updated_at: string;
  }
  ```
- [x] Buat file `frontend/hooks/useMealPlans.ts` dengan hooks:
  - `useMealPlans(from: string, to: string)` — query GET `/meal-plans?from=&to=`
  - `useCreateMealPlan()` — mutation POST
  - `useUpdateMealPlan()` — mutation PUT
  - `useDeleteMealPlan()` — mutation DELETE
  - Semua mutation invalidate query key `["meal-plans"]` on success
- [x] Jalankan `npx tsc --noEmit` untuk validasi

**Relevant Context:**
- Pola hook: `frontend/hooks/useTasks.ts`
- Type pattern: `frontend/types/index.ts` lines 170–188
- API client: `frontend/lib/api.ts`

**Status:** `[x] implemented`

---

### Task MP-6 — Frontend: Halaman Jadwal Makanan

**Intent:**
Membangun halaman `/meals` dengan tampilan grid mingguan (7 kolom hari × 3 baris waktu makan). User bisa menambah, edit, dan hapus slot. Ada navigasi minggu (< minggu lalu | minggu ini | minggu depan >).

**Expected Outcomes:**
- Grid 7×3 menampilkan semua slot meal plan minggu aktif
- Slot kosong menampilkan tombol "+" untuk menambah
- Slot terisi menampilkan nama masakan, catatan, dan ikon link resep
- Modal form tambah/edit dengan field: meal_type (disabled — sudah ditentukan dari slot), name, notes, recipe_url
- Tampilan responsif: grid horizontal di desktop, scroll vertikal di mobile
- TypeScript tidak ada error

**Todo List:**
- [x] Buat file `frontend/app/(dashboard)/meals/page.tsx`
- [x] State yang dikelola: `currentWeekStart` (Date), `modalOpen`, `selectedSlot` (date + meal_type), `selectedMealPlan`
- [x] Logika helper:
  - `getWeekDays(startDate)` — return array 7 Date dari Senin s/d Minggu
  - `getMealForSlot(meals, date, mealType)` — cari meal plan dari array berdasarkan date+type
- [x] Layout grid:
  - Header baris: kolom hari (Sen, Sel, Rab, ..., Min) + tanggal
  - Baris 1: Sarapan (06:00–09:00)
  - Baris 2: Makan Siang (11:00–13:00)
  - Baris 3: Makan Malam (18:00–20:00)
  - Tiap sel: tampilkan `MealSlotCard` (jika ada) atau `EmptySlot` (tombol +)
- [x] Buat komponen `MealSlotCard` — tampilkan nama, notes singkat, ikon link resep, tombol edit/hapus
- [x] Buat komponen `MealFormModal` — form tambah/edit (name, notes, recipe_url), validasi name wajib diisi
- [x] Navigasi minggu: tombol `< Prev` | label "Minggu ini" | tombol `Next >`, plus tombol "Hari Ini" reset ke minggu berjalan
- [x] Highlight kolom hari ini dengan warna teal ringan
- [x] Jalankan `npx tsc --noEmit` untuk validasi

**Relevant Context:**
- Pola halaman: `frontend/app/(dashboard)/tasks/page.tsx`
- Pola modal: `frontend/components/tasks/TaskModal.tsx`
- Design system: warna teal `primary-600`, background `#F4F6F8`, card `bg-white rounded-xl border border-neutral-100`

**Status:** `[x] implemented`

---

### Task MP-7 — Frontend: Sidebar & Navigasi

**Intent:**
Menambahkan menu "Jadwal Makanan" ke sidebar dan bottom nav, sesuai urutan yang diminta: setelah "Keuangan".

**Expected Outcomes:**
- Menu "Jadwal Makanan" muncul di sidebar desktop di posisi ke-5 (setelah Keuangan)
- Menu muncul di bottom nav mobile (gantikan salah satu yang kurang penting)
- Active state berfungsi saat berada di `/meals`

**Todo List:**
- [x] Edit `frontend/components/layout/Sidebar.tsx`:
  - Tambahkan import icon `UtensilsCrossed` dari lucide-react
  - Tambahkan entry di `NAV_ITEMS` setelah `/budget`: `{ href: "/meals", label: "Jadwal Makan", icon: UtensilsCrossed }`
- [x] Edit `frontend/components/layout/BottomNav.tsx`:
  - Tambahkan `/meals` di posisi yang sesuai (gantikan `/memories` atau tambah)
- [x] Jalankan `npx tsc --noEmit` untuk validasi

**Relevant Context:**
- Sidebar: `frontend/components/layout/Sidebar.tsx` lines 23–32
- Bottom nav: `frontend/components/layout/BottomNav.tsx`

**Status:** `[x] implemented`

---

### Task MP-8 — Frontend: Push Notification Setup

**Intent:**
Mengaktifkan push notification PWA di frontend. Browser akan meminta izin, menyimpan subscription ke backend, dan service worker akan menampilkan notifikasi saat diterima dari server.

**Expected Outcomes:**
- Browser meminta izin notifikasi saat user pertama kali buka `/meals`
- Subscription berhasil tersimpan ke backend
- Notifikasi muncul di HP/browser saat scheduler backend mengirim (jam 04:00 WIB)
- Bekerja di Chrome Android dan Safari iOS (dengan keterbatasan iOS < 16.4)

**Todo List:**
- [x] Tambahkan `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ke `frontend/.env.local` (dan `.env.example`)
- [x] Buat file `frontend/lib/pushNotification.ts`:
  - `requestPermission()` — minta izin browser
  - `subscribeToPush()` — daftarkan subscription ke browser + kirim ke backend `POST /push/subscribe`
  - `unsubscribeFromPush()` — hapus subscription dari browser + backend
- [x] Buat file `frontend/public/sw-push.js` (custom service worker handler):
  - Event listener `push` — parse payload JSON, tampilkan `self.registration.showNotification()`
  - Notifikasi: title "Menu Hari Ini 🍽️", body berisi daftar 3 menu, icon PWA
  - Event listener `notificationclick` — buka `/meals` saat notif diklik
- [x] Update `frontend/next.config.mjs` untuk include custom service worker
- [x] Tambahkan hook `usePushNotification()` di halaman `/meals`:
  - Saat halaman dimount, cek apakah sudah subscribe
  - Jika belum, tampilkan banner "Aktifkan notifikasi menu harian?"
- [x] Jalankan `npx tsc --noEmit` untuk validasi

**Relevant Context:**
- PWA config: `frontend/next.config.mjs`
- Service worker: `frontend/public/sw.js` (existing, generated by next-pwa)
- Manifest: `frontend/public/manifest.json`

**Status:** `[x] implemented`

---

## Urutan Pengerjaan yang Disarankan

```
MP-1 (Model)
    ↓
MP-2 (Repo + Service)
    ↓
MP-3 (Handler + Routes)     ← backend selesai, bisa ditest
    ↓
MP-4 (Push + Scheduler)     ← butuh MP-2 selesai (GetTodayMeals)
    ↓
MP-5 (Types + Hook FE)
    ↓
MP-6 (Halaman /meals)       ← inti frontend
    ↓
MP-7 (Sidebar nav)
    ↓
MP-8 (Push Notification FE) ← butuh MP-4 selesai
```

---

## Catatan Teknis

### VAPID Key Generation
Generate sekali, simpan di `.env`:
```bash
npx web-push generate-vapid-keys
```

### Meal Type Labels (Indonesia)
| value | label | emoji |
|---|---|---|
| `breakfast` | Sarapan | 🌅 |
| `lunch` | Makan Siang | ☀️ |
| `dinner` | Makan Malam | 🌙 |

### Format Notifikasi Harian
```
Title: "Menu Hari Ini 🍽️ — Selasa, 29 Agustus"
Body:  "🌅 Sarapan: Nasi Goreng\n☀️ Siang: Soto Ayam\n🌙 Malam: Belum direncanakan"
```

### Keterbatasan Push Notification iOS
- iOS Safari mendukung Web Push hanya mulai iOS 16.4+
- Harus diinstall sebagai PWA dulu (Add to Home Screen)
- Notifikasi tidak muncul saat app tidak di-install sebagai PWA


## Pembenahan hasil review — 2026-11-13
- CRUD meal memiliki validasi nama trim/panjang, tanggal dan rentang tanggal, waktu makan, catatan, dan URL resep HTTP(S). Edit dapat memindahkan tanggal/waktu makan serta mengosongkan catatan/resep. Update database tetap membatasi keluarga dan tidak membuat ulang record yang telah dihapus.
- Frontend memakai Zod dan form native, modal maksimal 360 px, nama akses kartu/dialog spesifik, tombol Hari Ini mereset hari mobile, tautan lama yang tidak aman tidak dirender sebagai link.
- Notifikasi memakai client API bersama dengan refresh token, memeriksa kegagalan server/config, memulihkan status tersimpan milik anggota saat mount, dan menyediakan nonaktifkan. Subscription baru yang gagal disimpan dibatalkan di browser.
- API status subscription baru; unsubscribe/upsert dibatasi family/member JWT. Upsert atomik menolak mengambil alih endpoint akun lain. Validasi endpoint hanya mengizinkan provider browser Google/Mozilla/Apple/Windows melalui HTTPS, memeriksa kunci P-256/auth, dan diulang sebelum pengiriman. Redirect pengiriman dinonaktifkan, timeout 15 detik; endpoint/token tidak dicatat di log.
- Scheduler dan tanggal memakai WIB eksplisit. Semua masakan per slot digabung dalam payload JSON; 404/410 membersihkan subscription. Error tidak lagi memotong string endpoint secara tidak aman.
- Verifikasi dan bukti rinci: docs/meal-plan-improvements.md. Pengiriman push ke perangkat nyata belum diuji; checklist implemented menyatakan implementasi tersedia, bukan klaim verifikasi perangkat.
