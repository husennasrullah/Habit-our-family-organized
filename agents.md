# Family Hub — Agent Guide

Dokumen ini adalah panduan kerja untuk agent/AI yang mengimplementasikan project Family Hub. **Baca seluruh dokumen ini sebelum memulai pengerjaan task apapun — khususnya section Status & Next Steps di bawah.**

> ⚠️ **ATURAN WAJIB AGENT:**
> 1. **Selalu baca `agents.md` di awal setiap sesi** sebelum mengerjakan apapun.
> 2. **Selalu update `agents.md` setiap selesai mengerjakan sesuatu** — sekecil apapun perubahannya.
> 3. Update minimal mencakup: file yang diubah, keputusan teknis penting, status terbaru, dan next steps.
> 4. Update dilakukan **sebelum** menutup sesi / melaporkan task selesai ke user.

---

## 🚦 STATUS TERKINI & NEXT STEPS
> Selalu update section ini setiap akhir sesi kerja.
> **Last updated:** 2026-09-02 (Fase 10 — Deployment setup)

### ✅ Sudah Selesai (semua fase)

| Fase | Deskripsi | Status |
|---|---|---|
| Fase 0 | Design system, wireframe, frontend plan | ✅ |
| Fase 1 | Setup repo, backend Golang, frontend Next.js | ✅ |
| Fase 2 | Auth (email/password + Google OAuth), Family management | ✅ |
| Fase 3 | Calendar API + halaman Calendar (3 view, WebSocket real-time) | ✅ |
| Fase 4 | Task/Chore API + halaman Tasks (kanban 3 kolom) | ✅ |
| Fase 5 | Budget API + halaman Budget | ✅ |
| Fase 6 | Memory API + halaman Memories | ✅ |
| Fase 7 | Kids Tracker API + halaman Kids | ✅ |
| Fase 8 | Documents API + halaman Documents | ✅ |
| Fase 9 | Home Dashboard (widget real-data), PWA lengkap | ✅ |
| UI Redesign | Seluruh tampilan frontend disesuaikan dengan mockup di `docs/ui-ux/` | ✅ |
| Fitur Jadwal Makanan | Meal plan grid 7×3, push notification jam 04:00 | ✅ |
| Fix Auth Loop | Loop reload & UNAUTHORIZED error setelah token expired | ✅ |
| Bug fixes & ngrok dev | CORS, refresh token, foto proxy, meal plan display | ✅ |
| Fase 10 — Deployment | Dockerfile, docker-compose.prod.yml, GitHub Actions CI/CD | ✅ |

### 🔄 Perubahan Penting yang Sudah Dilakukan (sesi terakhir)

#### Fase 10 — Deployment Setup — 2026-09-02
- `frontend/Dockerfile` — multi-stage build (deps → builder → runner), Node 20 Alpine, standalone output
- `frontend/next.config.mjs` — tambah `output: "standalone"` untuk Docker
- `frontend/.dockerignore` — exclude node_modules, .next, .env
- `backend/Dockerfile` — tambah `-ldflags="-s -w"` (ukuran binary lebih kecil), hapus copy `.env` ke image, tambah HEALTHCHECK
- `backend/.dockerignore` — exclude .env, .idea, migrations, bin
- `docker-compose.prod.yml` — production stack: postgres, redis, minio, backend, frontend (tanpa Nginx — pakai reverse proxy eksternal)
- `.env.example` — update dengan semua env vars production
- `.github/workflows/ci.yml` — CI: lint + typecheck + build + test (backend Go + frontend Next.js)
- `.github/workflows/cd.yml` — CD: build & push Docker image ke GHCR, deploy ke VPS via SSH
- `docs/deployment.md` — panduan lengkap: setup VPS, GitHub Secrets, jalankan production, troubleshooting

#### Logo User Custom — 2026-09-01
- `frontend/public/icons/assets-habit/` — tambah `logo-user-ayah.png`, `logo-user-ibu.png`, `logo-user-anak.png`
- `frontend/components/layout/Sidebar.tsx` — fallback avatar pakai icon custom: `child` → `logo-user-anak`, lainnya → `logo-user-ayah`
- `frontend/components/layout/Topbar.tsx` — sama, ganti initials fallback ke icon custom

#### Sidebar Collapsible (Icon-only mode) — 2026-09-01
- `frontend/stores/uiStore.ts` — tambah state `sidebarCollapsed` + action `toggleCollapsed`
- `frontend/components/layout/Sidebar.tsx` — width `w-64` ↔ `w-16` saat collapsed; logo title disembunyikan; nav label disembunyikan (icon only + tooltip); tombol `PanelLeftClose/Open` di header desktop; user info collapsed = avatar only
- `frontend/app/(dashboard)/layout.tsx` — wrap dalam `DashboardContent` yang baca `sidebarCollapsed`; padding kiri `lg:pl-64` ↔ `lg:pl-16` dengan CSS transition

#### Dark Mode — Full Audit Semua Halaman — 2026-09-01
- `frontend/package.json` — install `next-themes`
- `frontend/app/providers.tsx` — wrap dengan `ThemeProvider` (attribute="class", defaultTheme="system")
- `frontend/components/layout/Topbar.tsx` — tombol toggle Sun/Moon via `useTheme`
- `frontend/app/globals.css` — `dark:` variant pada `body`, `h1-h6`, `.card`
- `frontend/components/layout/Sidebar.tsx` — `dark:bg-neutral-900`, border, nav items
- `frontend/components/layout/BottomNav.tsx` — `dark:bg-neutral-900`, border
- `frontend/app/(dashboard)/layout.tsx` — `dark:bg-neutral-950`
- `frontend/app/(dashboard)/dashboard/page.tsx` — StatCard, semua cards, MiniCalendar
- `frontend/app/(dashboard)/tasks/page.tsx` — kanban cards, empty state, progress bar
- `frontend/app/(dashboard)/budget/page.tsx` — cards, tabs, filter chips, modal input
- `frontend/app/(dashboard)/memories/page.tsx` — filter pills, empty state
- `frontend/app/(dashboard)/documents/page.tsx` — search input, filter chips, cards, info bar
- `frontend/app/(dashboard)/kids/page.tsx` — semua tab (growth/vaccines/milestones/health), forms, sidebar list
- `frontend/app/(dashboard)/meals/page.tsx` — slot cards, detail modal, form modal, inputs

#### Rebranding ke HABIT + Icon Menu — 2026-09-01
- `frontend/components/layout/Sidebar.tsx` — ganti nama "Kenangan Keluarga" → logo `logo-habit.png` + `tittle-habit.png`. Ganti semua lucide icon nav dengan gambar dari `assets-habit/menu-*.png`
- `frontend/components/layout/BottomNav.tsx` — sama, ganti lucide icon dengan gambar `assets-habit/menu-*.png`
- `frontend/app/layout.tsx` — title & appleWebApp.title → "HABIT"
- `frontend/public/manifest.json` — name, short_name → "HABIT"

#### CORS — Allow All Origins — 2026-09-01
- `backend/internal/middleware/middleware.go` — ganti logic CORS berbasis allowlist ke `AllowOrigins: "*"` (allow all). Hapus dependency `os` dan `strings`. Set `AllowCredentials: false` (wajib jika AllowOrigins `*`). Hapus header `ngrok-skip-browser-warning`

#### Bug Fixes & Ngrok Dev Setup — 2026-08-31

**CORS & Ngrok:**
- `backend/internal/middleware/middleware.go` — ganti `AllowOrigins` string ke `AllowOriginsFunc` (map lookup) agar multi-origin reliable di Fiber v2.52. Tambah `ngrok-skip-browser-warning` ke `AllowHeaders`
- `frontend/lib/api.ts` — tambah header `ngrok-skip-browser-warning: true` di semua request axios (bypass ngrok interstitial)
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL=https://6587-202-165-33-7.ngrok-free.app/api/v1` (BE ngrok URL, update jika ngrok restart)
- `backend/.env` — `ALLOWED_ORIGINS=https://9bf5-202-165-33-7.ngrok-free.app` (FE ngrok URL, update jika ngrok restart)

**Auth — Refresh Token:**
- `backend/internal/services/auth_service.go` — `Refresh()` tidak lagi cek Redis; cukup validasi JWT signature + expiry. Token valid = issue token baru

**Meal Plan — Display Bug:**
- `frontend/app/(dashboard)/meals/page.tsx` — `getMealsForSlot()` ganti `.find()` → `.filter()` agar semua menu per slot tampil. Tambah `AddSlotButton` yang selalu muncul di bawah kartu. Tombol `+` tidak lagi tertutup data
- `frontend/app/(dashboard)/meals/page.tsx` — `date.slice(0,10)` untuk strip timestamp ISO (`"2026-08-31T00:00:00Z"` → `"2026-08-31"`) sebelum compare
- `frontend/app/(dashboard)/meals/page.tsx` — tambah `MealDetailModal` (bottom sheet mobile): klik kartu → lihat detail → Edit/Hapus
- `frontend/app/(dashboard)/meals/page.tsx` — fix `MealFormModal`: state `name/notes/recipeURL` sekarang di-sync via `useEffect` saat `isOpen/editingMeal` berubah (sebelumnya nilai lama tidak ter-reset)
- `frontend/app/(dashboard)/meals/page.tsx` — grid kalender dibungkus `overflow-x-auto` + `min-w-[640px]` untuk horizontal scroll di mobile

**Date Display Bug (semua fitur):**
- `frontend/components/budget/ExpenseModal.tsx` — `expense.date.slice(0,10)` untuk input `type="date"`
- `frontend/app/(dashboard)/budget/page.tsx` — `expense.date.slice(0,10)` untuk display di list
- `frontend/components/memories/MemoryModal.tsx` — `memory.date.slice(0,10)` untuk input date
- `frontend/app/(dashboard)/kids/page.tsx` — `h.date.slice(0,10)` untuk display health date

**Foto Kenangan — Proxy via Backend:**
- `backend/pkg/storage/storage.go` — tambah method `GetObject()` ke interface
- `backend/pkg/storage/minio.go` — implementasi `GetObject()` untuk stream file. `PublicURL()` sekarang return `""` jika tidak ada public URL (bukan path invalid `/keluarga/...`)
- `backend/internal/services/memory_service.go` — `resolvePhotos()` return URL proxy `/api/v1/memories/:memoryId/photos/:photoId/serve`. Tambah `GetPhotoStream()` method
- `backend/internal/handlers/memory_handler.go` — tambah `ServePhoto()` handler: stream foto dari MinIO ke browser via backend
- `backend/cmd/main.go` — daftarkan route `GET /memories/:id/photos/:photo_id/serve`
- `frontend/components/memories/MemoryCard.tsx` — `resolvePhotoUrl()` prefix relative URL dengan BE base URL
- `frontend/components/memories/PhotoLightbox.tsx` — sama

#### Fix Auth Loop Reload — 2026-08-30
**Root cause:**
1. `authStore.ts` — cookie `access_token` hanya `max-age=15 menit`. Saat expired, cookie hilang tapi `isAuthenticated=true` masih di localStorage (Zustand persist). Middleware baca cookie kosong → redirect `/login` → Zustand hydrate → set cookie lagi → redirect `/dashboard` → **loop**.
2. `api.ts` — saat refresh berhasil, token baru hanya disimpan ke `localStorage`, cookie tidak diperbarui → middleware langsung redirect lagi.
3. `providers.tsx` — `AuthSync` hanya melakukan re-set cookie dengan token lama, tidak mencoba refresh.

**Fix yang dilakukan:**
- `frontend/stores/authStore.ts` — tambah method `setAccessToken(token)` yang update localStorage + cookie sekaligus
- `frontend/lib/api.ts` — saat refresh berhasil: set cookie baru + panggil `setAccessToken`; saat refresh gagal: panggil `clearAuth()` + hapus cookie sebelum redirect `/login`
- `frontend/app/providers.tsx` — `AuthSync` sekarang memanggil `/auth/refresh` saat mount; jika berhasil → set token baru; jika gagal → `clearAuth()` + redirect login
- `frontend/middleware.ts` — tambah `/meals` ke `PROTECTED_PREFIXES`


#### Fitur Jadwal Makanan (Meal Plan) — Selesai semua 8 task
File backend baru:
- `backend/internal/models/meal_plan.go` — model + `backend/internal/models/push_subscription.go`
- `backend/internal/repositories/meal_plan_repo.go` + `push_subscription_repo.go`
- `backend/internal/services/meal_plan_service.go`
- `backend/internal/handlers/meal_plan_handler.go` + `push_handler.go`
- `backend/internal/scheduler/meal_notifier.go` — cron `0 4 * * *` (jam 04:00)
- `backend/internal/config/config.go` — tambah `PushConfig` (VAPID keys, NOTIFICATION_TIME)
- `backend/cmd/main.go` — route `/meal-plans` + `/push/subscribe` + scheduler distart sebagai goroutine

File frontend baru:
- `frontend/types/index.ts` — tambah `MealPlan`, `MealType`, `CreateMealPlanPayload`, `UpdateMealPlanPayload`
- `frontend/hooks/useMealPlans.ts` — React Query hooks
- `frontend/app/(dashboard)/meals/page.tsx` — halaman grid 7×3, modal form, push subscribe banner
- `frontend/public/sw-push.js` — service worker push event handler
- `frontend/components/layout/Sidebar.tsx` — tambah "Jadwal Makan" setelah Keuangan
- `frontend/components/layout/BottomNav.tsx` — ganti Kenangan → Menu (UtensilsCrossed)

Library backend ditambahkan:
- `github.com/SherClockHolmes/webpush-go` — Web Push VAPID
- `github.com/robfig/cron/v3` — cron scheduler

Untuk aktifkan notifikasi, tambahkan ke `backend/.env`:
```
VAPID_PUBLIC_KEY=...   # dari: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@keluarga.dev
NOTIFICATION_TIME=0 4 * * *
```

#### Config Loading — Diganti dari Viper ke godotenv
- File: [`backend/internal/config/config.go`](backend/internal/config/config.go)
- **Sebelum:** pakai `github.com/spf13/viper` + `viper.SetConfigFile(".env")` → gagal jika tidak dijalankan dari dalam folder `backend/`
- **Sekarang:** pakai `github.com/joho/godotenv` + `os.Getenv()`, mencari `.env` dari 3 lokasi (cwd, `backend/`, relative dari file source)
- `FRONTEND_BASE_URL` ditambahkan ke `GoogleConfig` → Google OAuth callback tidak lagi hardcoded

#### Google OAuth
- `FRONTEND_BASE_URL` sekarang dibaca dari env (default: `http://localhost:3000`)
- Tambahkan ke `backend/.env`: `FRONTEND_BASE_URL=http://localhost:3000`

#### UI Redesign — Semua halaman sudah disesuaikan dengan mockup `docs/ui-ux/`
| File | Perubahan |
|---|---|
| [`frontend/components/layout/Sidebar.tsx`](frontend/components/layout/Sidebar.tsx) | Logo pin kuning-hijau, nama "Kenangan Keluarga", garis kiri teal aktif |
| [`frontend/components/layout/Topbar.tsx`](frontend/components/layout/Topbar.tsx) | Search bar (prop `searchPlaceholder`), bell dot notifikasi |
| [`frontend/app/globals.css`](frontend/app/globals.css) | Background `#F4F6F8`, helper `.card` |
| [`frontend/app/(dashboard)/layout.tsx`](frontend/app/(dashboard)/layout.tsx) | Background konsisten |
| [`frontend/app/(dashboard)/dashboard/page.tsx`](frontend/app/(dashboard)/dashboard/page.tsx) | 4 stat card, tugas list dengan badge, progress bar pengeluaran, mini kalender SVG, reminder vaksin |
| [`frontend/app/(dashboard)/tasks/page.tsx`](frontend/app/(dashboard)/tasks/page.tsx) | Kanban 3 kolom (Akan Datang/Sedang Berjalan/Selesai), badge kategori |
| [`frontend/components/calendar/CalendarHeader.tsx`](frontend/components/calendar/CalendarHeader.tsx) | `< Hari Ini >` tengah, view toggle Hari/Minggu/Bulan |
| [`frontend/app/(dashboard)/memories/page.tsx`](frontend/app/(dashboard)/memories/page.tsx) | Filter tab pill, empty state ilustrasi SVG pohon |
| [`frontend/app/(dashboard)/kids/page.tsx`](frontend/app/(dashboard)/kids/page.tsx) | Sidebar "DAFTAR ANAK", tabel pertumbuhan 4 kolom, badge pill teal/biru, SVG line chart tren |
| [`frontend/app/(dashboard)/documents/page.tsx`](frontend/app/(dashboard)/documents/page.tsx) | Filter KTP/KK/Akta/Asuransi/BPJS, empty state + info bar enkripsi |

### 🗄️ Database (Belum Disetup di Mesin Lokal)
- PostgreSQL berjalan di host port 5432 (bukan Docker), password: `postgres`
- User `keluarga_user` dan database `keluarga` **belum dibuat** (user menolak saat diminta)
- Untuk setup: jalankan perintah berikut sekali saja:
```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -c "
  CREATE USER keluarga_user WITH PASSWORD 'keluarga_pass';
  CREATE DATABASE keluarga OWNER keluarga_user;
  GRANT ALL PRIVILEGES ON DATABASE keluarga TO keluarga_user;
"
```
- Seed data dummy: `cd backend && go run cmd/seed/main.go`
- Akun seed: `admin@keluarga.dev` / `password123`

### ⏳ Yang Belum Dikerjakan

| Task | Prioritas |
|---|---|
| **Halaman Register** — belum diupdate seperti login (masih pakai Card lama) | Sedang |
| Unit test backend (auth service, task service) | Sedang |
| Seed data production DB di VPS | Perlu dikerjakan |

### ⚡ Next Steps (langsung dikerjakan saat mulai sesi baru)
1. Setup GitHub repo + tambahkan secrets (lihat `docs/deployment.md` section 2)
2. Push ke `master` → CI/CD akan jalan otomatis
3. Opsional: update halaman Register agar tampilannya seperti halaman Login
4. Opsional: tulis unit test backend (auth service, task service)

> **⚠️ Catatan Dev Environment:**
> - Ngrok URL berubah setiap restart tunnel. Update dua tempat jika URL berubah:
>   1. `backend/.env` → `ALLOWED_ORIGINS=https://<FE-ngrok>.ngrok-free.app`
>   2. `frontend/.env.local` → `NEXT_PUBLIC_API_URL=https://<BE-ngrok>.ngrok-free.app/api/v1`
> - Setelah update `.env`, restart backend. Setelah update `.env.local`, restart Next.js (`npm run dev`)
> - Akun dev: `admin@keluarga.dev` / `password123`

---

## 📌 Referensi Utama

| Dokumen | Deskripsi |
|---|---|
| [`family-hub-plan.md`](family-hub-plan.md) | Plan lengkap: arsitektur, tech stack, database schema, fitur, dan semua task |

Selalu baca `family-hub-plan.md` untuk konteks lengkap sebelum mengerjakan task apapun.

---

## 🗂️ Struktur Project

```
project-root/
├── frontend/        # Next.js 14 App (PWA)
├── backend/         # Golang API Server
├── docs/            # Dokumentasi tambahan (design system, frontend plan, dll)
├── family-hub-plan.md
└── agents.md        # File ini
```

---

## ⚙️ Cara Kerja Agent

### 0. Wajib Dilakukan di Awal Setiap Sesi Baru
**Sebelum melakukan apapun**, baca `agents.md` terlebih dahulu:
1. Baca section **🚦 STATUS TERKINI & NEXT STEPS** — pahami apa yang sudah selesai dan apa yang belum
2. Baca section **🔄 Perubahan Penting yang Sudah Dilakukan** — pahami konteks pekerjaan terakhir
3. Baca section **⚡ Next Steps** — ini titik awal pengerjaan sesi ini
4. Jangan mengerjakan apapun sebelum membaca `agents.md`

### 1. Selalu Baca Plan Sebelum Mulai
Sebelum mengerjakan task apapun, baca section task yang relevan di [`family-hub-plan.md`](family-hub-plan.md). Pahami:
- **Intent** — tujuan task ini
- **Expected Outcomes** — hasil yang harus dicapai
- **Todo List** — langkah-langkah spesifik yang harus dikerjakan

### 2. Kerjakan Satu Task dalam Satu Waktu
- Jangan loncat ke task berikutnya sebelum task saat ini selesai dan divalidasi
- Setiap task backend dan frontend dikerjakan **berpasangan**: selesaikan backend dulu, baru frontend
- Setelah task selesai, update status di `family-hub-plan.md` dari `[ ]` menjadi `[x]`

### 3. Urutan Pengerjaan Wajib Diikuti
```
Fase 0 (UI/UX Design)
    ↓
Fase 1 (Setup Project)
    ↓
Fase 2 (Auth & Family)   ← backend dulu, lalu frontend
    ↓
Fase 3 (Calendar)        ← backend dulu, lalu frontend
    ↓
Fase 4 (Tasks)
    ↓
Fase 5 (Budget)
    ↓
Fase 6 (Memories)
    ↓
Fase 7 (Kids Tracker)
    ↓
Fase 8 (Documents)
    ↓
Fase 9 (Dashboard + PWA + Polish)
    ↓
Fase 10 (Testing + Deploy)
```

### 4. Tunggu Konfirmasi User Sebelum Lanjut
Setelah menyelesaikan setiap task, **selalu minta user untuk mengecek** sebelum melanjutkan ke task berikutnya. Jangan otomatis lanjut tanpa persetujuan.

### 5. Wajib Update `agents.md` Setelah Setiap Pekerjaan
**Setiap kali selesai mengerjakan sesuatu** (fix bug, tambah fitur, refactor, apapun), langsung update `agents.md`:
1. Update **Last updated** di baris pertama section STATUS TERKINI
2. Tambahkan entry baru di **🔄 Perubahan Penting yang Sudah Dilakukan** dengan format:
   ```
   #### [Nama Perubahan] — [tanggal YYYY-MM-DD]
   - file yang diubah dan apa yang diubah
   ```
3. Update tabel **✅ Sudah Selesai** jika ada fase/fitur baru yang selesai
4. Update tabel **⏳ Yang Belum Dikerjakan** — hapus yang sudah dikerjakan, tambah yang baru ditemukan
5. Update **⚡ Next Steps** — sesuaikan dengan kondisi terkini
6. Jangan tunggu sampai akhir sesi — update segera setelah setiap task selesai

---

## 🛠️ Tech Stack Ringkasan

### Frontend
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Shadcn/UI
- **State:** Zustand (global) + React Query/TanStack (server state)
- **Form:** React Hook Form + Zod
- **Charts:** Recharts
- **Date:** date-fns
- **HTTP:** Axios (dengan JWT interceptor)
- **PWA:** next-pwa

### Backend
- **Language:** Golang 1.22+
- **Framework:** Fiber v2
- **ORM:** GORM + PostgreSQL driver
- **Auth:** JWT (golang-jwt) + Bcrypt + Google OAuth (golang.org/x/oauth2)
- **Cache:** Redis
- **Realtime:** WebSocket (gorilla/websocket)
- **Config:** godotenv + os.Getenv (diganti dari Viper — lebih simpel, tidak ada masalah path)
- **Docs:** Swagger
- **Storage:** MinIO / Cloudflare R2

### Infrastructure
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Storage:** MinIO (local) / Cloudflare R2 (production)
- **Container:** Docker + Docker Compose
- **Proxy:** Nginx
- **SSL:** Let's Encrypt
- **CI/CD:** GitHub Actions

---

## 📐 Konvensi Koding

### Backend (Golang)

#### Struktur Package
```
internal/
├── config/        # App config via Viper
├── database/      # DB init & migration
├── middleware/    # Auth, CORS, Logger, Recovery
├── models/        # GORM struct models
├── handlers/      # HTTP request handlers (thin layer)
├── services/      # Business logic
├── repositories/  # Database queries
└── websocket/     # WebSocket hub & client
```

#### Konvensi Penamaan
- Package: `lowercase` (contoh: `authservice`, `userrepo`)
- Struct & interface: `PascalCase` (contoh: `FamilyMember`, `AuthService`)
- Fungsi publik: `PascalCase` (contoh: `CreateFamily`, `GetMemberByID`)
- Fungsi privat: `camelCase` (contoh: `hashPassword`, `generateToken`)
- Konstanta: `UPPER_SNAKE_CASE` (contoh: `MAX_TOKEN_EXPIRY`)
- File: `snake_case.go` (contoh: `family_member.go`, `auth_handler.go`)

#### Pola Handler
```go
// Handler hanya tangani request/response, delegasikan logika ke service
func (h *AuthHandler) Login(c *fiber.Ctx) error {
    var req LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(ErrorResponse{Message: "invalid request"})
    }
    result, err := h.authService.Login(req)
    if err != nil {
        return c.Status(401).JSON(ErrorResponse{Message: err.Error()})
    }
    return c.JSON(result)
}
```

#### Format Response API
```json
// Success
{ "data": { ... }, "message": "success" }

// Error
{ "message": "error description", "code": "ERROR_CODE" }

// List dengan pagination
{ "data": [...], "total": 100, "page": 1, "limit": 20 }
```

#### Environment Variables (Backend)
```env
APP_PORT=8080
APP_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=familyhub
DB_USER=postgres
DB_PASSWORD=secret

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h

GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/google/callback

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=familyhub
MINIO_USE_SSL=false

VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

---

### Frontend (Next.js)

#### Struktur Folder
```
frontend/
├── app/
│   ├── (auth)/           # Halaman login, register, callback
│   └── (dashboard)/      # Semua halaman setelah login
├── components/
│   ├── ui/               # Shadcn/UI primitives (jangan diubah)
│   ├── layout/           # Sidebar, Topbar, BottomNav
│   └── [module]/         # Komponen per modul (calendar, tasks, dst)
├── hooks/                # Custom React hooks (useAuth, useFamily, dst)
├── lib/
│   ├── api.ts            # Axios instance
│   ├── auth.ts           # Auth helpers
│   └── utils.ts          # cn() dan helpers lainnya
├── stores/               # Zustand stores
└── types/                # TypeScript type definitions
```

#### Konvensi Penamaan
- Komponen: `PascalCase.tsx` (contoh: `TaskCard.tsx`, `CalendarView.tsx`)
- Hook: `camelCase.ts` dengan prefix `use` (contoh: `useAuth.ts`, `useTasks.ts`)
- Store: `camelCase.ts` dengan suffix `Store` (contoh: `authStore.ts`)
- Type/Interface: `PascalCase` (contoh: `FamilyMember`, `EventPayload`)
- Util: `camelCase.ts` (contoh: `formatCurrency.ts`)

#### State Management — Apa yang Masuk Zustand vs React Query
```
Zustand (global client state):
├── Auth state (user, token, isAuthenticated)
├── Active family & members
├── UI state (sidebar open/close, theme)
└── WebSocket connection state

React Query (server state):
├── Semua data dari API (events, tasks, expenses, memories, dll)
├── Mutations (create, update, delete)
└── Cache otomatis & invalidasi
```

#### Axios Instance dengan JWT Auto-Refresh
```typescript
// lib/api.ts
// Interceptor request: tambah Authorization header
// Interceptor response: jika 401 → coba refresh token → retry request
// Jika refresh gagal → logout → redirect ke /login
```

#### Environment Variables (Frontend)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
```

---

## 🏠 Multi-Tenancy & Isolasi Data

Family Hub adalah aplikasi **multi-tenant** — banyak keluarga pakai satu sistem, tapi data masing-masing keluarga terisolasi penuh.

### Pemisah Utama: `family_id`

`family_id` adalah kolom yang wajib ada di semua tabel data dan menjadi satu-satunya pemisah antar keluarga di database.

### Tabel yang Wajib Punya `family_id`
```
events, tasks, expenses, budgets, shopping_items,
memories, documents, kids_profiles, family_members
```

### Aturan Wajib — `family_id` HARUS dari JWT, BUKAN dari Input User

```go
// ✅ BENAR — selalu ambil dari JWT context
familyID := c.Locals("family_id").(string)
db.Where("family_id = ?", familyID).Find(&events)

// ❌ SALAH — jangan pernah dari query/body/params
familyID := c.Query("family_id")   // celah keamanan!
familyID := c.Params("family_id")  // celah keamanan!
```

### 3 Lapis Isolasi

```
Lapis 1 — JWT menyimpan user_id + family_id + role
Lapis 2 — Middleware ekstrak family_id → inject ke c.Locals("family_id")
Lapis 3 — Semua query filter WHERE family_id = c.Locals("family_id")
```

### Middleware Auth (wajib inject family_id)

```go
func AuthMiddleware(c *fiber.Ctx) error {
    token := extractToken(c)
    claims := validateJWT(token)
    c.Locals("user_id", claims.UserID)
    c.Locals("family_id", claims.FamilyID)  // ← wajib selalu di-inject
    c.Locals("role", claims.Role)
    return c.Next()
}
```

---

## 🗄️ Database — Aturan Penting

- Semua tabel wajib punya kolom: `id` (UUID), `created_at`, `updated_at`
- Gunakan UUID untuk semua primary key (bukan auto-increment integer)
- Semua tabel data keluarga **wajib** punya kolom `family_id` (UUID, indexed)
- Semua migrasi disimpan di `backend/migrations/` dengan format: `001_init.sql`, `002_add_google_oauth.sql`, dst
- Jangan pernah drop kolom di migrasi — gunakan rename atau soft delete
- Soft delete menggunakan kolom `deleted_at` (GORM soft delete)
- Selalu buat index pada kolom `family_id` di setiap tabel untuk performa query

---

## 🔐 Auth Flow

### Email/Password
```
Register → hash password → simpan ke DB → return JWT
Login → cek email → verify password → return access token + refresh token
Refresh → validasi refresh token → return access token baru
Logout → invalidasi refresh token di Redis
```

### Google OAuth
```
/api/auth/google → redirect ke Google consent screen
/api/auth/google/callback → tukar code → ambil Google profile
  ├── Email baru → auto register → return JWT
  ├── Email ada (email/pass) → link google_id → return JWT
  └── Email ada (Google) → login → return JWT
Frontend /auth/callback → tangkap JWT dari query params → simpan → redirect dashboard
```

### JWT Strategy
- **Access Token:** expire 15 menit, dikirim via Authorization header
- **Refresh Token:** expire 7 hari, disimpan di Redis, dikirim via httpOnly cookie
- Semua endpoint privat wajib lewat middleware auth

---

## 🔄 WebSocket

- WebSocket hub berjalan di Golang, satu koneksi per user
- Setiap pesan punya format:
```json
{
  "type": "event_created | event_updated | task_completed | shopping_checked | ...",
  "family_id": "uuid",
  "payload": { ... }
}
```
- Frontend subscribe ke WebSocket saat masuk dashboard
- React Query di-invalidate saat menerima pesan WebSocket yang relevan

---

## 📁 File Storage (MinIO/R2)

- Bucket: `familyhub`
- Struktur path:
```
avatars/{family_id}/{member_id}.jpg
memories/{family_id}/{memory_id}/{filename}
documents/{family_id}/{document_id}/{filename}
receipts/{family_id}/{expense_id}/{filename}
```
- Akses file selalu via presigned URL (expired 1 jam untuk dokumen sensitif, 24 jam untuk foto)
- Dokumen yang ditandai sensitif dienkripsi dengan AES-256 sebelum upload

---

## ✅ Checklist Sebelum Selesai Setiap Task

Sebelum melaporkan task selesai, pastikan:

### Backend Task
- [ ] Semua endpoint di todo list sudah diimplementasi
- [ ] Validasi input sudah ada di setiap endpoint
- [ ] Middleware auth terpasang di semua endpoint privat
- [ ] Response format konsisten (data/message/code)
- [ ] Swagger annotation sudah ditambahkan
- [ ] Tidak ada `fmt.Println` debug yang tertinggal
- [ ] Unit test untuk business logic kritis sudah ditulis

### Frontend Task
- [ ] Semua halaman/komponen di todo list sudah diimplementasi
- [ ] Form sudah ada validasi Zod
- [ ] Loading state (skeleton) sudah ada
- [ ] Empty state sudah ada
- [ ] Error state sudah ada
- [ ] Tampilan responsif di mobile (min. 375px) dan desktop
- [ ] Tidak ada `console.log` debug yang tertinggal
- [ ] TypeScript tidak ada error (`any` hanya jika benar-benar terpaksa)

---

## 🚨 Hal yang Dilarang

- ❌ Jangan skip task atau loncat fase tanpa alasan jelas
- ❌ Jangan tambah library baru tanpa konfirmasi user
- ❌ Jangan ubah database schema yang sudah di-migrate tanpa migrasi baru
- ❌ Jangan hardcode credentials, API key, atau secret apapun di kode
- ❌ Jangan gunakan `any` di TypeScript kecuali benar-benar tidak ada alternatif
- ❌ Jangan implementasi fitur di luar scope task yang sedang dikerjakan
- ❌ Jangan lanjut ke task berikutnya sebelum mendapat konfirmasi user
- ❌ **Jangan pernah ambil `family_id` dari input user** (body/params/query) — selalu dari JWT context
- ❌ Jangan buat query database tanpa filter `family_id` pada tabel yang memilikinya

---

## 📝 Update Plan Setelah Task Selesai

Setiap kali task selesai, update status di [`family-hub-plan.md`](family-hub-plan.md):

```markdown
// Sebelum
#### [ ] Task 2.1 — Backend: Auth & Family API

// Sesudah
#### [x] Task 2.1 — Backend: Auth & Family API
```

Jika ada temuan penting saat implementasi (perubahan schema, keputusan teknis, dsb), tambahkan catatan di bagian bawah task yang relevan di plan file.

---

## 💬 Cara Komunikasi dengan User

- Laporkan progress setelah setiap task selesai dengan ringkasan singkat apa yang sudah dibuat
- Jika menemukan ambiguitas atau keputusan teknis yang perlu dipilih, tanyakan ke user sebelum lanjut
- Jika ada blocker (misal: credential belum ada, dependensi belum terinstall), laporkan segera
- Gunakan format checklist saat melaporkan progres task
