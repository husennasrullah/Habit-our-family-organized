# Panduan Menjalankan Keluarga Hub

> Dokumen ini mencakup cara menjalankan aplikasi di **development (lokal)**, **production (Docker)**, dan cara **install sebagai PWA** di Android & iOS.

---

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Clone & Struktur Project](#2-clone--struktur-project)
3. [Setup Environment Variables](#3-setup-environment-variables)
4. [Menjalankan di Development (Lokal)](#4-menjalankan-di-development-lokal)
5. [Menjalankan di Production (Docker)](#5-menjalankan-di-production-docker)
6. [Install sebagai PWA](#6-install-sebagai-pwa)
7. [Mengaktifkan Push Notification (Jadwal Makanan)](#7-mengaktifkan-push-notification-jadwal-makanan)
8. [Akses Layanan](#8-akses-layanan)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prasyarat

Pastikan semua tools berikut sudah terinstall sebelum mulai:

| Tool | Versi Minimum | Cek |
|------|---------------|-----|
| **Docker** | 24+ | `docker --version` |
| **Docker Compose** | 2.20+ | `docker compose version` |
| **Go** | 1.22+ | `go version` |
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |

> **Catatan:** Untuk mode production cukup Docker saja. Go dan Node.js hanya dibutuhkan untuk development.

---

## 2. Clone & Struktur Project

```bash
git clone <repo-url> keluarga-hub
cd keluarga-hub
```

Struktur folder:

```
keluarga-hub/
├── frontend/           # Next.js 14 (PWA)
├── backend/            # Golang API
├── docs/               # Dokumentasi
├── docker-compose.yml  # Infrastruktur (Postgres, Redis, MinIO)
├── .env.example        # Template env untuk docker-compose
└── RUNNING.md          # Dokumen ini
```

---

## 3. Setup Environment Variables

Harus dilakukan sebelum menjalankan apapun.

### 3.1 Root `.env` (untuk Docker Compose)

```bash
cp .env.example .env
```

Edit `.env` sesuai kebutuhan:

```env
# PostgreSQL
POSTGRES_DB=keluarga
POSTGRES_USER=keluarga_user
POSTGRES_PASSWORD=ganti_dengan_password_kuat

# Redis
REDIS_PASSWORD=ganti_dengan_password_kuat

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=ganti_dengan_password_kuat
```

### 3.2 Backend `.env`

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
APP_ENV=development
APP_PORT=8080

# Sesuaikan dengan .env di root
DB_HOST=localhost
DB_PORT=5432
DB_NAME=keluarga
DB_USER=keluarga_user
DB_PASSWORD=ganti_dengan_password_kuat
DB_SSL_MODE=disable

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=ganti_dengan_password_kuat
REDIS_DB=0

# Wajib: minimal 32 karakter acak
JWT_SECRET=isi_dengan_string_acak_minimal_32_karakter_di_sini
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h

# Google OAuth — buat di https://console.cloud.google.com
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URL=http://localhost:8080/api/v1/auth/google/callback

# Storage (MinIO dev)
STORAGE_ENDPOINT=localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=ganti_dengan_password_kuat
STORAGE_BUCKET=keluarga
STORAGE_USE_SSL=false
# STORAGE_PUBLIC_URL=    # kosongkan untuk dev (pakai presigned URL)
```

### 3.3 Frontend `.env.local`

```bash
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_APP_NAME=Keluarga
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

> **Catatan Google OAuth:** Jika belum punya credentials Google, fitur "Login dengan Google" akan dilewati. Login email/password tetap berfungsi.

---

## 4. Menjalankan di Development (Lokal)

Mode development menjalankan backend dan frontend secara terpisah dengan hot-reload.

### Step 1 — Jalankan infrastruktur

```bash
docker compose up -d postgres redis minio
```

Tunggu hingga semua container `healthy`:

```bash
docker compose ps
```

Output yang diharapkan:

```
NAME                 STATUS
keluarga_postgres    running (healthy)
keluarga_redis       running (healthy)
keluarga_minio       running (healthy)
```

### Step 2 — Jalankan Backend

```bash
cd backend
go run cmd/main.go
```

Atau dengan auto-reload menggunakan `air`:

```bash
# Install air (sekali saja)
go install github.com/air-verse/air@latest

# Jalankan
air
```

Output sukses:

```
Database migration completed
MinIO storage connected (bucket=keluarga)
Server starting on port 8080 (env: development)
```

### Step 3 — Jalankan Frontend

Buka terminal baru:

```bash
cd frontend
npm install        # hanya pertama kali
npm run dev
```

Output sukses:

```
▲ Next.js 14.x.x
- Local: http://localhost:3000
- Ready in 2.3s
```

### Step 4 — Buka di Browser

Buka `http://localhost:3000` dan daftarkan akun pertama.

---

## 5. Menjalankan di Production (Docker)

Mode production menjalankan semua layanan dalam satu perintah.

### Step 1 — Persiapan

Pastikan file `.env`, `backend/.env`, dan `frontend/.env.local` sudah terisi dengan nilai production yang aman (password kuat, JWT secret panjang, dll).

Untuk production, ubah beberapa nilai di `backend/.env`:

```env
APP_ENV=production
DB_HOST=postgres        # nama service docker, bukan localhost
REDIS_HOST=redis        # nama service docker
STORAGE_ENDPOINT=minio:9000   # nama service docker
```

### Step 2 — Build & Jalankan

```bash
# Dari root project
docker compose --profile full up -d --build
```

Flag `--profile full` mengaktifkan container backend yang defaultnya tidak aktif saat development.

### Step 3 — Verifikasi

```bash
# Cek semua container berjalan
docker compose ps

# Cek log backend
docker compose logs -f backend

# Cek log frontend (jika ada Dockerfile frontend)
docker compose logs -f frontend
```

### Perintah Berguna

```bash
# Stop semua layanan
docker compose down

# Stop + hapus volume (WARNING: menghapus semua data!)
docker compose down -v

# Restart satu layanan
docker compose restart backend

# Lihat log realtime
docker compose logs -f

# Update setelah ada perubahan kode
docker compose --profile full up -d --build backend
```

---

## 6. Install sebagai PWA

PWA hanya aktif di **production build**. Service worker tidak berjalan di mode `npm run dev`.

### 6.1 Build Production untuk Test PWA Lokal

```bash
cd frontend

# Build
npm run build

# Jalankan production server
npm start
```

Buka `http://localhost:3000` (bukan `https`, tapi tetap bisa test install di Android via LAN).

### 6.2 Install di Android (Chrome)

**Cara otomatis (banner muncul sendiri):**

1. Buka aplikasi di Chrome Android
2. Tunggu beberapa detik — banner **"Install Keluarga Hub"** akan muncul di bagian bawah layar
3. Tap **Install**
4. Aplikasi akan ditambahkan ke home screen

**Cara manual:**

1. Buka Chrome → ketuk menu ⋮ (tiga titik) di kanan atas
2. Pilih **"Add to Home screen"** atau **"Install app"**
3. Konfirmasi nama → **Add**

**Shortcut dari Home Screen:**

Long press ikon Keluarga di home screen → tampil shortcut langsung ke:
- 📅 Kalender
- ✅ Tugas
- 💰 Keuangan

### 6.3 Install di iOS (Safari)

> **Penting:** Harus menggunakan **Safari**, bukan Chrome/Firefox.

1. Buka `https://<domain-kamu>` di Safari
2. Tap ikon **Share** (kotak dengan panah ke atas) di toolbar bawah
3. Scroll ke bawah → pilih **"Add to Home Screen"**
4. Ubah nama jika diinginkan → tap **Add**

Ikon Keluarga Hub akan muncul di home screen dengan tampilan full-screen (tanpa address bar Safari).

### 6.4 Akses di Jaringan Lokal (HP ↔ Laptop)

Untuk test install PWA di HP menggunakan server development di laptop:

1. Cari IP lokal laptop:
   ```bash
   # Linux/Mac
   ip addr show | grep "inet " | grep -v 127
   
   # Windows
   ipconfig | findstr "IPv4"
   ```

2. Ubah `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.x.x:8080/api/v1
   NEXT_PUBLIC_WS_URL=ws://192.168.x.x:8080/ws
   ```

3. Rebuild frontend:
   ```bash
   npm run build && npm start -- -H 0.0.0.0
   ```

4. Buka `http://192.168.x.x:3000` di browser HP

> **Catatan iOS:** Safari di iOS hanya mengizinkan PWA dari **HTTPS**. Untuk test di iOS lokal, perlu setup sertifikat self-signed dengan `mkcert` atau deploy ke server dengan SSL.

### 6.5 Mengaktifkan HTTPS Lokal (untuk iOS)

```bash
# Install mkcert
brew install mkcert        # Mac
sudo apt install mkcert   # Linux

# Install CA certificate
mkcert -install

# Generate sertifikat untuk IP lokal
mkcert localhost 127.0.0.1 192.168.x.x

# Jalankan Next.js dengan HTTPS
npx next start --experimental-https \
  --experimental-https-key localhost+2-key.pem \
  --experimental-https-cert localhost+2.pem
```

---

## 7. Mengaktifkan Push Notification (Jadwal Makanan)

Push notification digunakan untuk mengirim **menu masakan hari ini setiap jam 04:00** ke semua anggota keluarga yang mengaktifkannya.

### 7.1 Generate VAPID Key (sekali saja)

VAPID key adalah sepasang kunci kriptografi untuk Web Push. Generate sekali dan simpan.

```bash
# Install web-push CLI (jika belum ada)
npm install -g web-push

# Generate VAPID key pair
npx web-push generate-vapid-keys
```

Output contoh:
```
=======================================
Public Key:
BL5z1234...panjang...

Private Key:
xXy9876...panjang...
=======================================
```

### 7.2 Tambahkan ke `backend/.env`

```env
# ─── Push Notification (Web Push / VAPID) ─────────────
VAPID_PUBLIC_KEY=BL5z1234...       # dari output di atas
VAPID_PRIVATE_KEY=xXy9876...       # dari output di atas
VAPID_SUBJECT=mailto:admin@keluarga.dev   # ganti dengan email kamu
NOTIFICATION_TIME=0 4 * * *        # cron: setiap hari jam 04:00
```

> **Format cron** `NOTIFICATION_TIME`:
> | Format | Arti |
> |---|---|
> | `0 4 * * *` | Setiap hari jam 04:00 (default) |
> | `0 6 * * *` | Setiap hari jam 06:00 |
> | `30 5 * * 1-5` | Senin–Jumat jam 05:30 |

### 7.3 Tambahkan ke `frontend/.env.local`

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BL5z1234...   # sama dengan VAPID_PUBLIC_KEY di backend
```

### 7.4 Aktifkan di Aplikasi

1. Buka halaman **Jadwal Makanan** (`/meals`)
2. Klik tombol **"Aktifkan Notifikasi"** di pojok kanan atas
3. Browser akan meminta izin notifikasi → klik **Allow / Izinkan**
4. Selesai! Notifikasi akan muncul setiap hari jam 04:00

Contoh notifikasi yang diterima:
```
📩 Menu Hari Ini 🍽️ — Jumat, 29 Agustus 2026
🌅 Sarapan: Nasi Goreng
☀️ Siang: Soto Ayam
🌙 Malam: Belum direncanakan
```

### 7.5 Keterbatasan Platform

| Platform | Support | Syarat |
|---|---|---|
| **Android (Chrome)** | ✅ Penuh | Tidak perlu install PWA |
| **Desktop (Chrome/Edge)** | ✅ Penuh | Tidak perlu install PWA |
| **iOS (Safari)** | ⚠️ Terbatas | iOS 16.4+ **+ harus install sebagai PWA dulu** |
| **iOS (Chrome/Firefox)** | ❌ Tidak support | — |
| **Firefox Desktop** | ✅ Penuh | — |

> **Untuk iOS:** Push notification hanya bekerja setelah app di-install ke Home Screen via Safari (Add to Home Screen). Lihat [bagian 6.3](#63-install-di-ios-safari).

### 7.6 Troubleshooting Notifikasi

**Tombol "Aktifkan Notifikasi" tidak muncul:**
- Pastikan akses via `https://` (bukan `http://`) — browser memblokir push API di non-HTTPS
- Pengecualian: `localhost` boleh pakai `http://`

**Notifikasi sudah diizinkan tapi tidak muncul:**
- Cek VAPID key sudah diisi benar di `backend/.env`
- Restart backend setelah mengubah `.env`
- Pastikan `NOTIFICATION_TIME` format cron benar

**Ingin test notifikasi sekarang tanpa menunggu jam 04:00:**
```bash
# Panggil endpoint debug (hanya untuk development)
curl -X POST http://localhost:8080/api/v1/push/test \
  -H "Authorization: Bearer <access_token>"
```

> Endpoint `/push/test` belum diimplementasi secara default. Bisa ditambahkan manual untuk keperluan development.

---

## 8. Akses Layanan

| Layanan | URL | Keterangan |
|---------|-----|------------|
| **Frontend (App)** | `http://localhost:3000` | Aplikasi utama |
| **Backend API** | `http://localhost:8080` | REST API |
| **API Health Check** | `http://localhost:8080/health` | Status backend |
| **Swagger Docs** | `http://localhost:8080/swagger` | Dokumentasi API |
| **MinIO Console** | `http://localhost:9001` | Kelola file storage |
| **WebSocket** | `ws://localhost:8080/ws` | Real-time sync |

**Kredensial MinIO Console (default dev):**
- Username: `minioadmin`
- Password: `minioadmin123`

---

## 9. Troubleshooting

### Backend gagal connect ke database

```
failed to connect to database
```

**Solusi:**
- Pastikan docker container postgres sudah `healthy`: `docker compose ps`
- Cek `DB_HOST` di `backend/.env` — harusnya `localhost` untuk dev, `postgres` untuk docker
- Tunggu 5–10 detik setelah `docker compose up` sebelum jalankan backend

---

### MinIO bucket tidak ditemukan

```
storage: failed to check bucket
```

**Solusi:**
- Cek MinIO container berjalan: `docker compose ps minio`
- Bucket `keluarga` akan dibuat otomatis saat backend pertama kali start
- Buka MinIO Console di `http://localhost:9001` untuk verifikasi

---

### PWA tidak bisa diinstall

**Kemungkinan penyebab:**
- Mode `npm run dev` — service worker tidak aktif di development
- **Solusi:** Gunakan `npm run build && npm start`

- Akses via `http://` bukan `https://` di iOS
- **Solusi:** Setup HTTPS dengan `mkcert` (lihat [bagian 6.5](#65-mengaktifkan-https-lokal-untuk-ios))

- Sudah pernah install sebelumnya
- **Solusi:** Uninstall dulu dari home screen, bersihkan cache browser

---

### Error `CORS` di frontend

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solusi:**
- Cek `NEXT_PUBLIC_API_URL` di `frontend/.env.local` sudah benar
- Cek backend berjalan di port yang benar (`8080`)
- Restart backend setelah ubah `.env`

---

### Port sudah dipakai

```
bind: address already in use
```

**Solusi:**
```bash
# Cari proses yang memakai port
lsof -i :3000   # frontend
lsof -i :8080   # backend
lsof -i :5432   # postgres

# Kill proses
kill -9 <PID>
```

---

### Foto tidak tampil setelah upload

**Kemungkinan penyebab:**
- MinIO bucket belum bisa diakses
- `STORAGE_ENDPOINT` salah

**Solusi:**
- Buka MinIO Console `http://localhost:9001`
- Pastikan bucket `keluarga` ada dan berisi file
- Cek `STORAGE_ENDPOINT` di `backend/.env`: untuk dev = `localhost:9000`

---

*Dokumen ini di-update terakhir mengikuti perkembangan project. Lihat [`family-hub-plan.md`](../family-hub-plan.md) untuk rencana fitur lengkap.*
