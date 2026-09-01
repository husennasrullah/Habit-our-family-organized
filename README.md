# Keluarga App

> *Semua cerita keluarga, dalam satu tempat*

Aplikasi manajemen keluarga all-in-one: kalender bersama, tugas & chore tracker, budget & expense tracker, kenangan keluarga, kids tracker, dan dokumen keluarga.

---

## Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI |
| Backend | Golang, Fiber v2, GORM |
| Database | PostgreSQL 15, Redis 7 |
| Storage | MinIO (lokal) / Cloudflare R2 (produksi) |
| Infra | Docker Compose, Nginx |

---

## Struktur Folder

```
.
├── frontend/        # Next.js 14 App
├── backend/         # Golang API
├── docs/            # Dokumentasi & design system
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Cara Menjalankan

Lihat **[`docs/RUNNING.md`](docs/RUNNING.md)** untuk panduan lengkap, termasuk:

- Setup environment variables
- Menjalankan di development (lokal)
- Menjalankan di production (Docker)
- Install sebagai PWA di Android & iOS
- Troubleshooting

**Quick start:**

```bash
# 1. Copy semua env
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Jalankan infrastruktur
docker compose up -d postgres redis minio

# 3. Jalankan backend
cd backend && go run cmd/main.go

# 4. Jalankan frontend (terminal baru)
cd frontend && npm install && npm run dev
```

| Layanan | URL |
|---------|-----|
| App | http://localhost:3000 |
| API | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |

---

## Dokumentasi

| Dokumen | Keterangan |
|---------|-----------|
| [`docs/RUNNING.md`](docs/RUNNING.md) | **Panduan lengkap menjalankan & install PWA** |
| [`docs/design-system.md`](docs/design-system.md) | Palet warna, tipografi, design token |
| [`docs/components.md`](docs/components.md) | Spesifikasi komponen kunci (hi-fi) |
| [`docs/frontend-plan.md`](docs/frontend-plan.md) | Rencana komponen & state per modul |
| [`family-hub-plan.md`](family-hub-plan.md) | Project plan lengkap |

---

## Status Pengerjaan

| Fase | Status |
|------|--------|
| FASE 0 — UI/UX Design | ✅ Selesai |
| FASE 1 — Fondasi & Setup | ✅ Selesai |
| FASE 2 — Auth & Family | ✅ Selesai |
| FASE 3 — Family Calendar | ✅ Selesai |
| FASE 4 — Tasks & Chore | ✅ Selesai |
| FASE 5 — Budget & Expense | ✅ Selesai |
| FASE 6 — Memories | ✅ Selesai |
| FASE 7 — Kids Tracker | ✅ Selesai |
| FASE 8 — Documents | ✅ Selesai |
| FASE 9 — Dashboard + PWA | ✅ Selesai |
| FASE 10 — Testing & Deploy | ⏳ Belum dimulai |
