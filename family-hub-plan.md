# Family Hub — Project Plan

## Overview

Family Hub adalah platform web privat berbasis PWA (Progressive Web App) yang dirancang untuk membantu keluarga mengelola kehidupan sehari-hari dalam satu tempat. Dibangun oleh solo developer menggunakan **Golang** (backend) dan **Next.js** (frontend/PWA), platform ini mencakup kalender keluarga, manajemen tugas, pelacak keuangan, jurnal memori, pelacak tumbuh kembang anak, dan penyimpanan dokumen penting keluarga.

Tujuan utama: **private, cepat, bisa diakses dari HP semua anggota keluarga (Android & iOS), tanpa bergantung pada layanan pihak ketiga.**

---

## Tech Stack

### Frontend
| Teknologi | Kegunaan |
|---|---|
| Next.js 14 (App Router) | Framework React utama |
| TypeScript | Type safety |
| Tailwind CSS | Styling utility-first |
| Shadcn/UI | Komponen UI siap pakai |
| React Query (TanStack) | Data fetching & caching |
| Zustand | State management global |
| next-pwa | PWA support (service worker, manifest) |
| React Hook Form + Zod | Form handling & validasi |
| Recharts | Grafik & visualisasi data |
| date-fns | Manipulasi tanggal |

### Backend
| Teknologi | Kegunaan |
|---|---|
| Golang 1.22+ | Bahasa utama backend |
| Fiber v2 | HTTP framework |
| GORM | ORM untuk PostgreSQL |
| JWT (golang-jwt) | Autentikasi token |
| Redis | Cache & session |
| WebSocket (gorilla/websocket) | Real-time sync |
| Bcrypt | Hash password |
| Viper | Konfigurasi environment |
| Swagger | API documentation |
| golang.org/x/oauth2 | Google OAuth 2.0 flow |
| google.golang.org/api | Ambil profil user dari Google |

### Database & Storage
| Teknologi | Kegunaan |
|---|---|
| PostgreSQL 15 | Database utama |
| Redis 7 | Cache, session, real-time pub/sub |
| MinIO (self-hosted) / Cloudflare R2 | Penyimpanan foto & dokumen |

### Infrastructure & DevOps
| Teknologi | Kegunaan |
|---|---|
| Docker & Docker Compose | Containerisasi lokal & deploy |
| Nginx | Reverse proxy |
| VPS / Fly.io / Railway | Hosting |
| GitHub Actions | CI/CD pipeline |
| Let's Encrypt | SSL certificate |

---

## Arsitektur Sistem

```
Client (Browser / PWA di HP)
        │
        ▼
   Next.js App (Frontend)
        │
        ├── REST API calls ──────────────────▶ Golang API Server
        └── WebSocket connection ────────────▶ Golang WebSocket Server
                                                      │
                                          ┌───────────┼───────────┐
                                          ▼           ▼           ▼
                                     PostgreSQL     Redis      MinIO/R2
                                     (main db)    (cache)    (files)
```

---

## Struktur Folder

### Frontend (Next.js)
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Home dashboard
│   │   ├── calendar/
│   │   ├── tasks/
│   │   ├── budget/
│   │   ├── memories/
│   │   ├── kids/
│   │   ├── documents/
│   │   └── settings/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                           # Shadcn components
│   ├── layout/                       # Navbar, Sidebar, Footer
│   ├── calendar/
│   ├── tasks/
│   ├── budget/
│   ├── memories/
│   ├── kids/
│   └── documents/
├── lib/
│   ├── api.ts                        # Axios instance
│   ├── auth.ts                       # Auth helpers
│   └── utils.ts
├── hooks/                            # Custom React hooks
├── stores/                           # Zustand stores
├── types/                            # TypeScript types
└── public/
    ├── manifest.json                 # PWA manifest
    └── icons/                        # PWA icons
```

### Backend (Golang)
```
backend/
├── cmd/
│   └── main.go                       # Entry point
├── internal/
│   ├── config/                       # Konfigurasi app
│   ├── database/                     # DB connection & migration
│   ├── middleware/                   # Auth, CORS, Logger
│   ├── models/                       # GORM models
│   ├── handlers/                     # HTTP handlers per module
│   │   ├── auth.go
│   │   ├── family.go
│   │   ├── calendar.go
│   │   ├── tasks.go
│   │   ├── budget.go
│   │   ├── memories.go
│   │   ├── kids.go
│   │   └── documents.go
│   ├── services/                     # Business logic
│   ├── repositories/                 # Data access layer
│   └── websocket/                    # WebSocket hub
├── pkg/
│   ├── jwt/
│   ├── storage/                      # MinIO/R2 helper
│   └── mailer/                       # Email notification
├── migrations/                       # SQL migration files
├── docker-compose.yml
└── Dockerfile
```

---

## Database Schema

### Tabel Utama

```sql
-- Keluarga
families (id, name, invite_code, created_at, updated_at)

-- Anggota keluarga
family_members (
  id, family_id, name, email, password_hash,
  role,        -- admin | member | child | view_only
  avatar_url, color, birth_date,
  created_at, updated_at
)

-- Events kalender
events (
  id, family_id, created_by, title, description,
  start_at, end_at, is_all_day,
  type,        -- general | school | medical | birthday | vacation
  color, is_recurring, recurrence_rule,
  reminder_minutes, created_at, updated_at
)

-- Tugas/Chore
tasks (
  id, family_id, assigned_to, created_by,
  title, description, points,
  status,      -- pending | in_progress | done
  due_date, is_recurring, recurrence_rule,
  created_at, updated_at
)

-- Pengeluaran
expenses (
  id, family_id, created_by,
  amount, currency, category,
  description, date, receipt_url,
  created_at, updated_at
)

-- Budget target
budgets (
  id, family_id, category,
  amount, period,  -- monthly | weekly | yearly
  month, year, created_at, updated_at
)

-- Shopping list
shopping_items (
  id, family_id, added_by,
  name, quantity, unit, category,
  is_checked, checked_by, created_at
)

-- Memori/Jurnal
memories (
  id, family_id, created_by,
  title, content, date,
  is_favorite, created_at, updated_at
)

-- Foto memori
memory_photos (
  id, memory_id, url, caption, order, created_at
)

-- Data anak
kids_profiles (
  id, member_id, family_id,
  created_at, updated_at
)

-- Riwayat tinggi & berat
growth_records (
  id, kid_id, height_cm, weight_kg,
  head_circumference_cm, date, notes, created_at
)

-- Vaksin
vaccine_records (
  id, kid_id, vaccine_name, scheduled_date,
  given_date, given_by, notes,
  status,      -- scheduled | given | overdue
  created_at
)

-- Milestone anak
milestones (
  id, kid_id, title, category,
  achieved_at, notes, created_at
)

-- Riwayat sakit
health_records (
  id, kid_id, type, description,
  date, doctor, medication, notes, created_at
)

-- Dokumen keluarga
documents (
  id, family_id, uploaded_by,
  title, type,     -- ktp | kk | akta | asuransi | other
  file_url, file_size, is_encrypted,
  tags, created_at, updated_at
)

-- Screen time log (manual)
screen_time_logs (
  id, kid_id, date,
  duration_minutes, app_category,
  notes, created_at
)
```

---

## Fitur Lengkap per Module

### Module 1 — Auth & Family Management
- Register & login dengan email + password
- Buat family baru atau join via invite code
- Kelola profil anggota keluarga (nama, foto, warna, role)
- Role: Admin, Member, Child, View Only
- JWT authentication dengan refresh token

### Module 2 — Family Calendar
- Tambah, edit, hapus event
- Tampilan kalender: harian, mingguan, bulanan
- Warna event berdasarkan anggota keluarga
- Tipe event: umum, sekolah, medis, ulang tahun, liburan
- Recurring event (harian, mingguan, bulanan, tahunan)
- Reminder & push notification
- Real-time sync antar perangkat via WebSocket

### Module 3 — Chore & Task Manager
- Buat dan assign tugas ke anggota keluarga
- Point/reward system untuk anak
- Status: pending, in progress, done
- Tugas berulang (recurring)
- Leaderboard poin keluarga mingguan
- Notifikasi saat tugas selesai

### Module 4 — Family Budget & Expense Tracker
- Catat pemasukan dan pengeluaran keluarga
- Kategori pengeluaran (makan, sekolah, transportasi, kesehatan, dll)
- Budget target per kategori per bulan
- Grafik pengeluaran bulanan dan tahunan
- Shared shopping list dengan real-time sync
- Laporan bulanan dan tahunan (export PDF)

### Module 5 — Family Memory & Journal
- Buat entri jurnal dengan teks dan foto
- Upload multiple foto per memori
- Timeline kronologis
- Tag anggota keluarga di foto
- Tandai sebagai favorit
- Album per tahun / event

### Module 6 — Kids Tracker
- Profil per anak
- Grafik pertumbuhan (tinggi, berat, lingkar kepala) vs standar WHO
- Jadwal vaksin lengkap (IDAI) dengan reminder
- Checklist milestone perkembangan per usia
- Riwayat kesehatan & obat
- Screen time log manual harian
- Info sekolah anak

### Module 7 — Family Documents & Notes
- Upload dan simpan dokumen penting (PDF, foto)
- Kategori: KTP, KK, Akta, Asuransi, BPJS, dll
- Enkripsi untuk dokumen sensitif
- Kontak darurat keluarga
- Catatan & resep penting

### Module 8 — PWA & Notifikasi
- Install sebagai app di Android dan iOS
- Service worker untuk offline mode dasar
- Push notification untuk reminder dan event
- Responsive UI untuk semua ukuran layar
- Splash screen dan app icon

---

## API Endpoint (Ringkasan)

```
AUTH
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh

FAMILY
POST   /api/family
GET    /api/family/:id
POST   /api/family/join
GET    /api/family/:id/members
PUT    /api/family/members/:id

CALENDAR
GET    /api/events
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id

TASKS
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/complete

BUDGET
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
GET    /api/budgets
POST   /api/budgets
GET    /api/shopping-items
POST   /api/shopping-items
PATCH  /api/shopping-items/:id/check

MEMORIES
GET    /api/memories
POST   /api/memories
PUT    /api/memories/:id
DELETE /api/memories/:id
POST   /api/memories/:id/photos

KIDS
GET    /api/kids
POST   /api/kids
GET    /api/kids/:id/growth
POST   /api/kids/:id/growth
GET    /api/kids/:id/vaccines
POST   /api/kids/:id/vaccines
GET    /api/kids/:id/milestones
POST   /api/kids/:id/milestones

DOCUMENTS
GET    /api/documents
POST   /api/documents
DELETE /api/documents/:id

WEBSOCKET
WS     /ws
```

---

## Rencana Pengerjaan

---

### FASE 0 — UI/UX Design

---

#### [x] Task 0.1 — Design System & Branding

**Intent:**
Menetapkan identitas visual Family Hub secara konsisten sebelum masuk ke implementasi frontend, sehingga semua halaman punya tampilan yang seragam dan tidak perlu revisi bolak-balik saat coding.

**Expected Outcomes:**
- Palet warna, tipografi, dan ikon terdefinisi dengan jelas
- Komponen dasar UI sudah terdokumentasi (button, input, card, badge, modal, dll)
- Panduan warna per anggota keluarga tersedia
- Design token siap dipakai di Tailwind config

**Todo List:**
- [ ] Tentukan nama & tagline aplikasi (contoh: "Family Hub — Semua untuk Keluarga")
- [ ] Pilih palet warna utama (primary, secondary, accent, neutral, error, success)
- [ ] Tentukan palet warna anggota keluarga (6-8 warna berbeda untuk tiap member)
- [ ] Pilih tipografi (font heading & body — rekomendasi: Inter atau Plus Jakarta Sans)
- [ ] Pilih set ikon (rekomendasi: Lucide Icons — sudah bundled dengan Shadcn)
- [ ] Definisikan design token: spacing, border radius, shadow, font size
- [ ] Dokumentasikan design system di `docs/design-system.md`
- [ ] Setup Tailwind config dengan custom color palette dan font

---

#### [x] Task 0.2 — Wireframe & Layout Utama

**Intent:**
Membuat kerangka kasar (wireframe) untuk semua halaman utama agar struktur layout sudah jelas sebelum masuk ke implementasi, sehingga tidak ada perubahan struktur besar saat coding.

**Expected Outcomes:**
- Wireframe tersedia untuk semua halaman utama (bisa di Figma, Excalidraw, atau sketsa)
- Layout responsif mobile-first sudah terdefinisi
- Navigasi antar halaman sudah terpetakan
- Struktur komponen per halaman sudah jelas

**Todo List:**
- [ ] Wireframe halaman Login & Register (termasuk tombol Google OAuth)
- [ ] Wireframe halaman Onboarding (buat/join keluarga)
- [ ] Wireframe layout utama dashboard (sidebar desktop, bottom nav mobile)
- [ ] Wireframe halaman Home Dashboard (susunan widget)
- [ ] Wireframe halaman Calendar (view bulanan, mingguan, harian)
- [ ] Wireframe halaman Tasks (list/kanban + leaderboard)
- [ ] Wireframe halaman Budget (tab pengeluaran, budget, shopping list)
- [ ] Wireframe halaman Memories (grid foto + timeline)
- [ ] Wireframe halaman Kids Tracker (profil anak + tab detail)
- [ ] Wireframe halaman Documents (grid dokumen + kategori)
- [ ] Wireframe halaman Settings & Profil
- [ ] Petakan user flow navigasi antar halaman

---

#### [ ] Task 0.3 — Desain Komponen Kunci (Hi-Fi)

**Intent:**
Membuat desain high-fidelity untuk komponen-komponen yang paling sering dipakai dan paling kompleks, supaya implementasi frontend lebih terarah dan hasilnya konsisten.

**Expected Outcomes:**
- Desain final (hi-fi) tersedia untuk komponen kunci
- Tampilan mobile dan desktop sudah dipertimbangkan
- State komponen terdefinisi: default, hover, active, disabled, loading, empty, error

**Todo List:**
- [ ] Desain komponen navigasi: sidebar (desktop) + bottom navigation bar (mobile)
- [ ] Desain komponen kalender (event card, badge warna anggota)
- [ ] Desain komponen task card (status, poin, avatar assigned)
- [ ] Desain komponen expense card dan grafik ringkasan budget
- [ ] Desain komponen memory card (foto thumbnail + caption)
- [ ] Desain komponen kids growth chart (grafik garis dengan kurva WHO)
- [ ] Desain halaman Login & Register (termasuk Google OAuth button)
- [ ] Desain Home Dashboard (susunan dan isi widget)
- [ ] Definisikan semua state: loading skeleton, empty state, error state
- [ ] Dokumentasikan komponen di `docs/components.md`

---

#### [x] Task 0.4 — Perencanaan Frontend per Modul

**Intent:**
Sebelum mulai coding setiap modul frontend, dokumentasikan rencana komponen, state management, dan API integration agar implementasi lebih terarah dan terstruktur.

**Expected Outcomes:**
- Daftar komponen per halaman/modul terdokumentasi
- State yang dikelola Zustand vs React Query sudah dipetakan
- Mapping endpoint API ke komponen frontend sudah jelas
- Urutan pengerjaan komponen dalam setiap modul sudah ditentukan

**Todo List:**
- [ ] Buat dokumen `docs/frontend-plan.md`
- [ ] Peta komponen untuk setiap modul (Auth, Calendar, Tasks, Budget, Memories, Kids, Documents)
- [ ] Tentukan data apa yang masuk Zustand (global) vs React Query (server state)
- [ ] Mapping API endpoint → hook React Query per modul
- [ ] Tentukan komponen yang bisa di-reuse antar modul (misal: AvatarGroup, DatePicker, FileUploader)
- [ ] Tentukan urutan pengerjaan komponen dalam setiap modul (bottom-up: atomic → molekul → halaman)

---

### FASE 1 — Fondasi & Setup Project

---

#### [x] Task 1.1 — Setup Repository & Struktur Project

**Intent:**
Menyiapkan struktur monorepo dan semua konfigurasi dasar agar pengerjaan selanjutnya bisa berjalan dengan konsisten.

**Expected Outcomes:**
- Repository Git aktif dengan struktur folder `frontend/` dan `backend/`
- `.gitignore`, `README.md`, dan `docker-compose.yml` tersedia
- Environment variables terdokumentasi di `.env.example`

**Todo List:**
- [ ] Inisialisasi Git repository
- [ ] Buat folder `frontend/` dan `backend/`
- [ ] Setup `docker-compose.yml` untuk PostgreSQL, Redis, MinIO
- [ ] Buat `.env.example` untuk frontend dan backend
- [ ] Buat `README.md` dasar

---

#### [x] Task 1.2 — Setup Backend (Golang)

**Intent:**
Menyiapkan project Golang dengan semua dependency, konfigurasi, koneksi database, dan struktur folder yang akan dipakai selama pengerjaan.

**Expected Outcomes:**
- Golang project berjalan dengan Fiber framework
- Koneksi ke PostgreSQL dan Redis berhasil
- Auto migration GORM aktif
- Health check endpoint tersedia di `GET /health`
- Middleware CORS, logger, dan recovery terpasang

**Todo List:**
- [ ] Init Go module (`go mod init`)
- [ ] Install dependency: Fiber, GORM, PostgreSQL driver, Redis, JWT, Viper, Bcrypt
- [ ] Setup struktur folder sesuai arsitektur
- [ ] Buat konfigurasi via Viper (baca dari `.env`)
- [ ] Setup koneksi PostgreSQL dengan GORM
- [ ] Setup koneksi Redis
- [ ] Buat base model (ID, CreatedAt, UpdatedAt)
- [ ] Pasang middleware: CORS, Logger, Recovery
- [ ] Buat health check endpoint
- [ ] Setup Swagger untuk dokumentasi API

---

#### [x] Task 1.3 — Setup Frontend (Next.js)

**Intent:**
Menyiapkan project Next.js dengan semua dependency UI, konfigurasi PWA, dan struktur folder yang siap untuk pengembangan fitur.

**Expected Outcomes:**
- Next.js 14 project berjalan dengan TypeScript
- Tailwind CSS dan Shadcn/UI terpasang dan berfungsi
- PWA manifest dan service worker terkonfigurasi
- Axios instance dengan interceptor JWT tersedia
- Layout dasar (sidebar, navbar) tersedia

**Todo List:**
- [ ] Buat project Next.js 14 dengan TypeScript
- [ ] Install dan setup Tailwind CSS
- [ ] Install dan setup Shadcn/UI
- [ ] Install dependency: React Query, Zustand, React Hook Form, Zod, Recharts, date-fns, Axios
- [ ] Setup `next-pwa` dan buat `manifest.json`
- [ ] Buat Axios instance dengan JWT interceptor dan auto refresh token
- [ ] Buat Zustand store untuk auth state
- [ ] Buat layout utama: sidebar navigasi dan topbar
- [ ] Setup route group `(auth)` dan `(dashboard)`
- [ ] Buat halaman 404 dan loading state

---

### FASE 2 — Auth & Family Management

---

#### [x] Task 2.1 — Backend: Auth & Family API

**Intent:**
Membangun sistem autentikasi lengkap (email/password + Google OAuth) dan manajemen keluarga sebagai fondasi seluruh fitur lainnya.

**Expected Outcomes:**
- API register, login, logout, dan refresh token berfungsi
- JWT access token (15 menit) dan refresh token (7 hari) aktif
- Login via Google OAuth berfungsi (redirect → callback → JWT)
- Akun Google dan email/password bisa di-link ke satu user yang sama
- API buat keluarga baru dan join via invite code berfungsi
- API kelola anggota keluarga (CRUD) berfungsi
- Middleware auth memproteksi semua endpoint privat

**Todo List:**
- [ ] Buat model: `Family`, `FamilyMember`
- [ ] Tambah field pada model `FamilyMember`: `google_id`, `avatar_url` (dari Google), `auth_provider` (email | google | both)
- [ ] Jalankan migrasi tabel
- [ ] Buat service & repository untuk auth
- [ ] Implementasi handler: register, login, logout, refresh token (email/password)
- [ ] Buat JWT helper (generate, validate, refresh)
- [ ] Buat middleware auth (validasi JWT di header)
- [ ] Setup Google OAuth credentials di Google Cloud Console (Client ID & Secret)
- [ ] Implementasi handler `GET /api/auth/google` — redirect user ke halaman consent Google
- [ ] Implementasi handler `GET /api/auth/google/callback` — tukar authorization code dengan Google profile
- [ ] Handle 3 skenario di callback:
  - Email belum ada di DB → auto register → login → return JWT
  - Email sudah ada (via email/password) → link Google account → login → return JWT
  - Email sudah ada (via Google) → login langsung → return JWT
- [ ] Simpan `google_id` dan `avatar_url` dari Google profile ke DB
- [ ] Implementasi handler: buat family, join family via invite code
- [ ] Implementasi handler: CRUD anggota keluarga
- [ ] Upload avatar anggota ke MinIO/R2 (untuk yang daftar via email/password)
- [ ] Tulis unit test untuk auth service

---

#### [x] Task 2.2 — Frontend: Halaman Auth & Family Setup

**Intent:**
Membangun halaman login, register, dan onboarding setup keluarga yang akan menjadi pintu masuk aplikasi, dengan dukungan login via Google OAuth.

**Expected Outcomes:**
- Halaman login dan register berfungsi dengan validasi form
- Tombol "Login dengan Google" tersedia di halaman login dan register
- Setelah login (via email/password maupun Google), user diarahkan ke dashboard
- Halaman onboarding untuk buat keluarga baru atau join keluarga tersedia
- Halaman kelola anggota keluarga (tambah, edit, hapus) tersedia
- Auth state tersimpan di Zustand dan persistent via localStorage

**Todo List:**
- [ ] Buat halaman `/login` dengan form email & password
- [ ] Tambah tombol "Login dengan Google" di halaman login (dengan ikon Google)
- [ ] Buat halaman `/register` dengan validasi Zod
- [ ] Tambah tombol "Daftar dengan Google" di halaman register
- [ ] Buat halaman `/auth/callback` untuk menangkap JWT setelah redirect dari Google OAuth
- [ ] Implementasi Zustand auth store (login, logout, user state)
- [ ] Simpan JWT ke localStorage setelah callback Google berhasil
- [ ] Buat halaman onboarding: pilih buat keluarga baru atau join
- [ ] Buat form buat keluarga baru
- [ ] Buat form join keluarga via invite code
- [ ] Buat halaman settings/members untuk kelola anggota
- [ ] Buat komponen avatar uploader (hanya tampil jika auth provider bukan Google)
- [ ] Implementasi route protection (redirect ke login jika belum auth)
- [ ] Buat halaman profil user (tampilkan badge "Connected with Google" jika pakai OAuth)

---

### FASE 3 — Family Calendar

---

#### [x] Task 3.1 — Backend: Calendar API

**Intent:**
Membangun API untuk manajemen event kalender keluarga dengan dukungan recurring event dan notifikasi.

**Expected Outcomes:**
- CRUD endpoint untuk events berfungsi
- Filter event berdasarkan bulan/minggu/hari tersedia
- Recurring event tersimpan dengan recurrence rule
- WebSocket hub berjalan untuk real-time sync event

**Todo List:**
- [ ] Buat model `Event`
- [ ] Jalankan migrasi tabel
- [ ] Implementasi CRUD handler untuk events
- [ ] Implementasi query filter: by date range, by member, by type
- [ ] Implementasi logika recurring event (generate instance)
- [ ] Setup WebSocket hub (gorilla/websocket)
- [ ] Broadcast event create/update/delete ke semua member via WebSocket
- [ ] Implementasi reminder system (cek dan kirim notifikasi)

---

#### [x] Task 3.2 — Frontend: Halaman Calendar

**Intent:**
Membangun tampilan kalender interaktif yang menampilkan event semua anggota keluarga dengan sinkronisasi real-time.

**Expected Outcomes:**
- Kalender tampil dalam view bulanan, mingguan, dan harian
- Event tampil dengan warna berdasarkan anggota keluarga
- Modal tambah/edit/hapus event berfungsi
- Real-time sync via WebSocket aktif
- Tampilan responsif di mobile

**Todo List:**
- [ ] Buat komponen kalender bulanan dari scratch (atau gunakan library ringan)
- [ ] Buat komponen kalender mingguan dan harian
- [ ] Implementasi toggle view (bulanan/mingguan/harian)
- [ ] Buat modal form tambah event (title, tanggal, waktu, tipe, warna, recurring)
- [ ] Buat modal detail dan edit event
- [ ] Implementasi WebSocket client untuk real-time update
- [ ] Tampilkan indikator warna per anggota keluarga
- [ ] Implementasi filter event berdasarkan anggota
- [ ] Buat komponen event badge dan tooltip
- [ ] Pastikan tampilan responsif di layar kecil

---

### FASE 4 — Chore & Task Manager

---

#### [x] Task 4.1 — Backend: Task API

**Intent:**
Membangun API manajemen tugas keluarga dengan sistem poin dan reward untuk anak.

**Expected Outcomes:**
- CRUD endpoint untuk tasks berfungsi
- Endpoint complete task dan update status berfungsi
- Kalkulasi total poin per anggota tersedia
- Leaderboard endpoint tersedia

**Todo List:**
- [ ] Buat model `Task`
- [ ] Jalankan migrasi tabel
- [ ] Implementasi CRUD handler untuk tasks
- [ ] Implementasi endpoint complete task (update status + tambah poin)
- [ ] Implementasi query tasks berdasarkan assigned_to, status, due_date
- [ ] Implementasi endpoint leaderboard (ranking poin mingguan)
- [ ] Broadcast task update via WebSocket

---

#### [x] Task 4.2 — Frontend: Halaman Tasks

**Intent:**
Membangun halaman manajemen tugas yang intuitif dengan visualisasi poin dan leaderboard keluarga.

**Expected Outcomes:**
- Daftar tugas tampil dikelompokkan berdasarkan status
- Form tambah/edit tugas berfungsi dengan assign ke anggota
- Tombol complete task berfungsi dan poin terupdate
- Leaderboard mingguan tampil dengan animasi
- Filter tugas berdasarkan anggota dan status berfungsi

**Todo List:**
- [ ] Buat halaman tasks dengan tampilan kanban atau list
- [ ] Buat komponen task card (judul, assigned to, poin, due date, status)
- [ ] Buat modal form tambah/edit task
- [ ] Implementasi tombol complete dengan konfirmasi
- [ ] Buat komponen leaderboard poin keluarga
- [ ] Implementasi filter dan sort tasks
- [ ] Buat badge poin per anggota keluarga
- [ ] Real-time update via WebSocket

---

### FASE 5 — Budget & Expense Tracker

---

#### [ ] Task 5.1 — Backend: Budget API

**Intent:**
Membangun API untuk pencatatan keuangan keluarga, budget target, dan shopping list bersama.

**Expected Outcomes:**
- CRUD endpoint untuk expenses berfungsi
- Endpoint summary pengeluaran per kategori dan per bulan tersedia
- CRUD endpoint untuk budget target berfungsi
- CRUD endpoint untuk shopping list dengan real-time sync berfungsi

**Todo List:**
- [ ] Buat model: `Expense`, `Budget`, `ShoppingItem`
- [ ] Jalankan migrasi tabel
- [ ] Implementasi CRUD handler untuk expenses
- [ ] Implementasi endpoint summary: total per kategori, per bulan, per tahun
- [ ] Implementasi CRUD handler untuk budget target
- [ ] Implementasi CRUD handler untuk shopping items
- [ ] Endpoint check/uncheck shopping item
- [ ] Broadcast shopping list update via WebSocket
- [ ] Upload foto struk belanja ke MinIO/R2

---

#### [ ] Task 5.2 — Frontend: Halaman Budget

**Intent:**
Membangun halaman keuangan keluarga dengan visualisasi grafik dan shopping list yang bisa dipakai bersama secara real-time.

**Expected Outcomes:**
- Daftar pengeluaran tampil dengan filter bulan dan kategori
- Grafik pengeluaran per kategori (pie chart) dan per bulan (bar chart) tampil
- Indikator budget vs aktual per kategori tampil
- Shopping list real-time berfungsi (centang item langsung sync ke semua device)

**Todo List:**
- [ ] Buat halaman budget dengan tab: Pengeluaran, Budget, Shopping List
- [ ] Buat komponen daftar expense dengan filter bulan dan kategori
- [ ] Buat modal form tambah expense (nominal, kategori, tanggal, catatan)
- [ ] Implementasi grafik pie chart pengeluaran per kategori (Recharts)
- [ ] Implementasi grafik bar chart tren bulanan (Recharts)
- [ ] Buat komponen budget target per kategori dengan progress bar
- [ ] Buat komponen shopping list dengan real-time sync via WebSocket
- [ ] Implementasi tambah/centang/hapus item shopping list
- [ ] Buat ringkasan keuangan bulanan di dashboard

---

### FASE 6 — Family Memory & Journal

---

#### [ ] Task 6.1 — Backend: Memory API

**Intent:**
Membangun API untuk jurnal dan galeri foto keluarga dengan penyimpanan file ke object storage.

**Expected Outcomes:**
- CRUD endpoint untuk memories berfungsi
- Upload multiple foto per memory berfungsi dan tersimpan di MinIO/R2
- Endpoint filter memory berdasarkan tahun/bulan dan favorit tersedia

**Todo List:**
- [ ] Buat model: `Memory`, `MemoryPhoto`
- [ ] Jalankan migrasi tabel
- [ ] Implementasi CRUD handler untuk memories
- [ ] Implementasi upload foto ke MinIO/R2 (multiple file per memory)
- [ ] Generate presigned URL untuk akses foto
- [ ] Endpoint filter: by date range, by favorite, by tag member
- [ ] Endpoint toggle favorite memory
- [ ] Endpoint delete foto individual dari memory

---

#### [ ] Task 6.2 — Frontend: Halaman Memories

**Intent:**
Membangun halaman jurnal keluarga dengan tampilan galeri foto yang indah dan timeline kronologis.

**Expected Outcomes:**
- Daftar memori tampil dalam grid foto atau timeline
- Form tambah memori dengan editor teks dan upload foto berfungsi
- Lightbox untuk lihat foto fullscreen berfungsi
- Filter berdasarkan tahun dan favorit berfungsi
- Tampilan responsif di mobile

**Todo List:**
- [ ] Buat halaman memories dengan tampilan grid dan timeline
- [ ] Buat modal/halaman form tambah memori (judul, tanggal, konten, foto)
- [ ] Implementasi multi-file upload dengan preview
- [ ] Buat komponen galeri foto dengan lightbox
- [ ] Implementasi toggle favorite
- [ ] Buat filter berdasarkan tahun dan bulan
- [ ] Buat tampilan detail memori (full page)
- [ ] Optimasi lazy loading gambar

---

### FASE 7 — Kids Tracker

---

#### [ ] Task 7.1 — Backend: Kids API

**Intent:**
Membangun API untuk memantau tumbuh kembang anak secara komprehensif termasuk pertumbuhan fisik, vaksin, dan milestone.

**Expected Outcomes:**
- CRUD endpoint untuk profil anak berfungsi
- Endpoint riwayat pertumbuhan dengan data referensi WHO tersedia
- Endpoint jadwal dan riwayat vaksin berfungsi
- Endpoint milestone perkembangan anak berfungsi
- Endpoint riwayat kesehatan berfungsi

**Todo List:**
- [ ] Buat model: `KidProfile`, `GrowthRecord`, `VaccineRecord`, `Milestone`, `HealthRecord`
- [ ] Jalankan migrasi tabel
- [ ] Seed data: jadwal vaksin IDAI standar
- [ ] Seed data: checklist milestone per usia (WHO/IDAI)
- [ ] Implementasi CRUD profil anak
- [ ] Implementasi CRUD growth records
- [ ] Implementasi endpoint data referensi pertumbuhan WHO (by usia & jenis kelamin)
- [ ] Implementasi CRUD vaccine records
- [ ] Auto-generate jadwal vaksin saat profil anak dibuat
- [ ] Implementasi CRUD milestones
- [ ] Implementasi CRUD health records

---

#### [ ] Task 7.2 — Frontend: Halaman Kids Tracker

**Intent:**
Membangun halaman pemantauan anak yang informatif dengan grafik pertumbuhan dan checklist milestone yang mudah digunakan.

**Expected Outcomes:**
- Profil setiap anak tampil dengan ringkasan informasi
- Grafik pertumbuhan (tinggi & berat) vs kurva WHO tampil dengan jelas
- Jadwal vaksin tampil dengan status (sudah/belum/terlambat)
- Checklist milestone per usia tampil dan bisa dicentang
- Riwayat kesehatan tampil dalam list kronologis

**Todo List:**
- [ ] Buat halaman kids dengan list profil setiap anak
- [ ] Buat halaman detail anak dengan tab: Pertumbuhan, Vaksin, Milestone, Kesehatan
- [ ] Implementasi grafik pertumbuhan line chart (tinggi & berat) dengan referensi WHO (Recharts)
- [ ] Buat form tambah data pertumbuhan
- [ ] Buat tampilan jadwal vaksin dengan badge status (hijau/merah/kuning)
- [ ] Buat form catat vaksin yang sudah diberikan
- [ ] Buat checklist milestone per kelompok usia
- [ ] Buat form tambah catatan kesehatan
- [ ] Buat komponen screen time log harian (input manual)

---

### FASE 8 — Documents & Notes

---

#### [ ] Task 8.1 — Backend: Documents API

**Intent:**
Membangun API untuk penyimpanan dokumen penting keluarga dengan enkripsi untuk file sensitif.

**Expected Outcomes:**
- Endpoint upload dan download dokumen berfungsi
- Enkripsi AES untuk dokumen sensitif aktif
- Filter dokumen berdasarkan tipe dan tag berfungsi
- Presigned URL untuk akses file aman tersedia

**Todo List:**
- [ ] Buat model `Document`
- [ ] Jalankan migrasi tabel
- [ ] Implementasi upload dokumen ke MinIO/R2
- [ ] Implementasi enkripsi AES untuk dokumen bertanda sensitif
- [ ] Generate presigned URL untuk download
- [ ] Implementasi CRUD dokumen
- [ ] Endpoint filter: by type, by tag
- [ ] Endpoint kontak darurat (CRUD notes)

---

#### [ ] Task 8.2 — Frontend: Halaman Documents

**Intent:**
Membangun halaman penyimpanan dokumen yang aman dan mudah dicari dengan kategorisasi yang jelas.

**Expected Outcomes:**
- Daftar dokumen tampil dikelompokkan per kategori
- Upload dokumen baru berfungsi dengan indikator enkripsi
- Download dokumen berfungsi
- Search dokumen berdasarkan nama dan tag berfungsi

**Todo List:**
- [ ] Buat halaman documents dengan tampilan grid dan list
- [ ] Implementasi upload dokumen (drag & drop + file picker)
- [ ] Buat komponen document card (nama, tipe, ukuran, tanggal, badge enkripsi)
- [ ] Implementasi download dokumen
- [ ] Buat filter kategori dokumen
- [ ] Implementasi search dokumen
- [ ] Buat halaman/section kontak darurat keluarga
- [ ] Buat section catatan penting (simple rich text notes)

---

### FASE 9 — Dashboard & Polish

---

#### [ ] Task 9.1 — Home Dashboard

**Intent:**
Membangun halaman utama yang menjadi ringkasan semua modul sehingga informasi penting langsung terlihat saat buka aplikasi.

**Expected Outcomes:**
- Widget ringkasan dari semua modul tampil di satu halaman
- Navigasi ke setiap modul mudah dan intuitif
- Data yang tampil relevan dan up-to-date
- Tampilan responsif di semua ukuran layar

**Todo List:**
- [ ] Buat layout dashboard dengan grid widget
- [ ] Widget kalender: event hari ini dan besok
- [ ] Widget tasks: tugas yang harus diselesaikan hari ini
- [ ] Widget budget: ringkasan pengeluaran bulan ini vs budget
- [ ] Widget kids: reminder vaksin yang mendekat
- [ ] Widget memories: foto terbaru keluarga
- [ ] Widget shopping: item shopping list yang belum dicentang
- [ ] Implementasi greeting berdasarkan waktu hari
- [ ] Buat navigasi bottom bar untuk mobile (PWA)

---

#### [x] Task 9.2 — PWA & Notifikasi

**Intent:**
Mengaktifkan semua fitur PWA agar aplikasi bisa diinstall di HP dan mengirim notifikasi push.

**Expected Outcomes:**
- Aplikasi bisa diinstall di Android dan iOS dari browser
- Service worker aktif untuk offline mode dasar (tampilkan cache saat offline)
- Push notification untuk reminder vaksin dan event kalender berfungsi
- Prompt install to home screen muncul otomatis

**Todo List:**
- [ ] Lengkapi `manifest.json` (nama, ikon semua ukuran, theme color, display standalone)
- [ ] Konfigurasi `next-pwa` untuk generate service worker
- [ ] Implementasi cache strategy untuk halaman utama (offline fallback)
- [ ] Setup Web Push di backend (generate VAPID keys)
- [ ] Implementasi endpoint subscribe/unsubscribe push notification
- [ ] Implementasi push notification untuk reminder event kalender
- [ ] Implementasi push notification untuk reminder vaksin
- [ ] Implementasi push notification untuk task due date
- [ ] Buat komponen banner "Install App" yang muncul saat belum terinstall
- [ ] Test install di Android (Chrome) dan iOS (Safari)

---

#### [x] Task 9.3 — Settings & Final Polish

**Intent:**
Melengkapi pengaturan aplikasi dan memoles UI/UX agar aplikasi terasa selesai dan nyaman digunakan.

**Expected Outcomes:**
- Halaman settings lengkap tersedia
- Dark mode berfungsi
- Loading states dan error handling konsisten di seluruh aplikasi
- Animasi transisi halaman berjalan smooth

**Todo List:**
- [ ] Buat halaman settings (profil, keluarga, notifikasi, keamanan)
- [ ] Implementasi dark mode dengan Tailwind dan next-themes
- [ ] Audit dan lengkapi loading skeleton di semua halaman
- [ ] Audit dan lengkapi error state dan empty state di semua halaman
- [ ] Tambahkan animasi page transition
- [ ] Implementasi toast notification untuk feedback aksi user
- [ ] Buat halaman tentang aplikasi dan panduan penggunaan
- [ ] Optimasi performa: image lazy loading, code splitting
- [ ] Pastikan semua form punya validasi yang konsisten

---

### FASE 10 — Testing & Deployment

---

#### [ ] Task 10.1 — Testing

**Intent:**
Memastikan semua fitur utama berjalan dengan benar sebelum deploy ke production.

**Expected Outcomes:**
- Unit test untuk business logic kritis di backend lulus
- End-to-end flow utama (auth, calendar, budget) terverifikasi
- Tidak ada bug kritis yang ditemukan

**Todo List:**
- [ ] Tulis unit test untuk auth service (register, login, refresh token)
- [ ] Tulis unit test untuk budget summary calculation
- [ ] Tulis unit test untuk growth record comparison dengan data WHO
- [ ] Test manual semua endpoint API dengan Swagger / Postman
- [ ] Test install PWA di Android (Chrome)
- [ ] Test install PWA di iOS (Safari)
- [ ] Test push notification di Android dan iOS
- [ ] Test real-time sync WebSocket (buka di 2 device sekaligus)
- [ ] Test responsivitas UI di berbagai ukuran layar

---

#### [ ] Task 10.2 — Deployment

**Intent:**
Men-deploy aplikasi ke server sehingga bisa diakses oleh semua anggota keluarga dari mana saja.

**Expected Outcomes:**
- Backend Golang berjalan di VPS/platform cloud
- Frontend Next.js ter-deploy dan bisa diakses via domain
- SSL/HTTPS aktif (wajib untuk PWA dan push notification)
- Database PostgreSQL dan Redis berjalan stabil
- CI/CD pipeline aktif untuk auto-deploy saat push ke main

**Todo List:**
- [ ] Setup VPS atau pilih platform: Fly.io / Railway / DigitalOcean
- [ ] Buat `Dockerfile` untuk backend Golang
- [ ] Buat `Dockerfile` untuk frontend Next.js
- [ ] Update `docker-compose.yml` untuk production
- [ ] Setup Nginx sebagai reverse proxy
- [ ] Setup SSL dengan Let's Encrypt (Certbot)
- [ ] Konfigurasi environment variables di server
- [ ] Setup database backup otomatis (cron job pg_dump ke storage)
- [ ] Setup GitHub Actions workflow untuk CI/CD
- [ ] Deploy dan verifikasi semua fitur berjalan di production
- [ ] Share URL ke anggota keluarga dan panduan install PWA

---

## Urutan Pengerjaan Disarankan

```
Fase 0 (UI/UX Design)  ← sebelum coding frontend apapun
    ↓
Fase 1 (Setup)
    ↓
Fase 2 (Auth & Family) ← fondasi semua fitur
    ↓
Fase 3 (Calendar)      ← paling sering dipakai
    ↓
Fase 4 (Tasks)         ← simple, cepat selesai
    ↓
Fase 5 (Budget)        ← fitur harian penting
    ↓
Fase 6 (Memories)      ← fun feature
    ↓
Fase 7 (Kids Tracker)  ← fitur terpanjang
    ↓
Fase 8 (Documents)     ← fitur pelengkap
    ↓
Fase 9 (Dashboard + PWA + Polish)
    ↓
Fase 10 (Testing + Deploy)
```

> 💡 **Catatan:** Fase 0 tidak harus selesai 100% sebelum mulai coding.
> Cukup selesaikan Task 0.1 dan 0.2 (design system + wireframe) sebelum mulai Fase 2 frontend.
> Task 0.3 dan 0.4 bisa dikerjakan paralel saat backend setiap modul sedang berjalan.

---

## Multi-Tenancy & Isolasi Data

Family Hub menggunakan pendekatan **multi-tenancy berbasis `family_id`** — setiap keluarga terisolasi penuh satu sama lain dalam satu database.

### Prinsip Utama

- `family_id` adalah pemisah utama antar keluarga di semua tabel data
- Setiap tabel yang menyimpan data keluarga **wajib** memiliki kolom `family_id`
- `family_id` **tidak boleh** diambil dari input user (body/params/query) — harus selalu diambil dari JWT token yang sudah divalidasi
- Middleware auth wajib mengekstrak `family_id` dari JWT dan inject ke request context
- Semua query database wajib difilter dengan `WHERE family_id = ?` menggunakan nilai dari context

### Tabel yang Wajib Punya `family_id`

```
families          → tabel induk (id = family_id itu sendiri)
family_members    → anggota keluarga
events            → kalender
tasks             → tugas/chore
expenses          → pengeluaran
budgets           → target budget
shopping_items    → daftar belanja
memories          → jurnal & foto
documents         → dokumen keluarga
kids_profiles     → profil anak
```

### Alur Isolasi — 3 Lapis Keamanan

```
Lapis 1 — JWT Token
├── Setiap login menghasilkan JWT
├── JWT menyimpan: user_id + family_id + role
└── Semua request wajib menyertakan JWT ini

Lapis 2 — Middleware Auth (Golang)
├── Validasi JWT di setiap request
├── Ekstrak family_id dari JWT payload
└── Inject family_id ke Fiber context: c.Locals("family_id", familyID)

Lapis 3 — Query Database
├── family_id diambil dari context, BUKAN dari input user
├── Semua query: db.Where("family_id = ?", c.Locals("family_id"))
└── User tidak bisa mengakses data keluarga lain meskipun tahu family_id-nya
```

### Contoh Pattern yang Benar di Handler

```go
// ✅ BENAR — family_id dari JWT context
func (h *EventHandler) GetEvents(c *fiber.Ctx) error {
    familyID := c.Locals("family_id").(string)
    events, err := h.eventService.GetByFamily(familyID)
    ...
}

// ❌ SALAH — family_id dari input user (celah keamanan!)
func (h *EventHandler) GetEvents(c *fiber.Ctx) error {
    familyID := c.Query("family_id") // berbahaya!
    ...
}
```

---

## Sistem Login & Family Management

### Alur Onboarding

```
User Register / Login
        ↓
Sudah punya keluarga?
   TIDAK → Halaman Onboarding
              ├── "Buat Keluarga Baru" → isi nama → jadi Admin → dapat invite code
              └── "Gabung Keluarga"    → masukkan invite code → jadi Member
   YA   → Langsung ke Dashboard
```

### Role Anggota Keluarga

| Role | Deskripsi | Akses |
|---|---|---|
| `admin` | Kepala keluarga (bisa lebih dari 1) | Full akses + kelola anggota + hapus data |
| `member` | Anggota dewasa | Baca & tulis semua data keluarga |
| `child` | Anak dengan akun sendiri | Akses terbatas (lihat tugas & kalender) |
| `view_only` | Kakek/nenek | Hanya bisa lihat kalender & foto |

### Cara Tambah Anggota

- **Via Invite Code** — Admin share kode unik, anggota dewasa register & masukkan kode
- **Tambah Langsung** — Admin tambah profil anak kecil tanpa akun (dikelola oleh admin)

### Keputusan Desain

- Satu user hanya bisa bergabung di **satu keluarga** (tidak multi-family) — menyederhanakan UI dan logika
- Boleh ada **lebih dari satu Admin** — Ayah & Ibu keduanya bisa jadi admin
- Anak kecil tidak perlu akun login — cukup profil yang dikelola oleh admin

---

## Catatan Penting

- Setiap task backend dan frontend dikerjakan **berpasangan** (selesaikan backend dulu, baru frontend)
- Prioritaskan **Fase 1–5** untuk MVP yang sudah bisa dipakai keluarga sehari-hari
- Fase 6–8 bisa dikerjakan setelah MVP berjalan
- Simpan semua credentials dan environment variables di tempat yang aman
- Lakukan backup database secara rutin sejak awal production
- **Jangan pernah** mengambil `family_id` dari input user — selalu dari JWT context
