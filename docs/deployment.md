# Deployment Guide — HABIT

## Overview

Setup CI/CD menggunakan **GitHub Actions** + **Docker** + **GHCR** (GitHub Container Registry).

```
Push ke master
     │
     ├─► CI (ci.yml)  — lint + typecheck + build + test
     │
     └─► CD (cd.yml)  — build Docker images → push ke GHCR → deploy ke VPS via SSH
```

**Domain:** `https://habit.senlabs.web.id`

**Port yang digunakan:**
- Frontend → `3001` (internal container: `3000`)
- Backend  → `8081` (internal container: `8080`)

Reverse proxy (Nginx) di VPS mengatur routing domain ke port tersebut.

---

## 1. Persiapan VPS

### Install Docker & Docker Compose
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt-get install -y docker-compose-plugin
```

### Clone repo ke VPS
```bash
git clone https://github.com/USERNAME/REPO_NAME.git /home/ubuntu/habit
cd /home/ubuntu/habit
cp .env.example .env
nano .env   # isi semua nilai production
```

---

## 2. GitHub Secrets

Buka **GitHub repo → Settings → Secrets and variables → Actions**, tambahkan:

| Secret | Nilai |
|--------|-------|
| `SSH_HOST` | IP VPS |
| `SSH_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | Isi dari `cat ~/.ssh/deploy_key` di VPS |
| `SSH_PORT` | `22` |
| `DEPLOY_PATH` | `/home/ubuntu/habit` |
| `FRONTEND_URL` | `https://habit.senlabs.web.id` |
| `BACKEND_URL` | `https://habit.senlabs.web.id` |
| `NEXT_PUBLIC_API_URL` | `https://habit.senlabs.web.id/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://habit.senlabs.web.id` |
| `VAPID_PUBLIC_KEY` | VAPID public key kamu |

> SSH key yang dipakai: `~/.ssh/deploy_key` (sudah ada di VPS, sudah terdaftar di `authorized_keys`)

### Aktifkan write permissions GitHub Actions
**Settings → Actions → General → Workflow permissions** → pilih **Read and write permissions**

---

## 3. Setup `.env` di VPS

```bash
cd /home/ubuntu/habit
cp .env.example .env
nano .env
```

Isi minimal yang wajib diubah:

```env
# Domain
FRONTEND_URL=https://habit.senlabs.web.id
BACKEND_URL=https://habit.senlabs.web.id

# PostgreSQL (pakai DB yang sudah berjalan di VPS)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=keluarga
DB_USER=keluarga_user
DB_PASSWORD=password_kamu

# Redis
REDIS_PASSWORD=redis_password_kamu

# JWT
JWT_SECRET=random_string_min_32_chars

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=password_minio

# VAPID
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

## 4. Jalankan Production Pertama Kali

```bash
cd /home/ubuntu/habit

# Pull image terbaru dari GHCR (setelah CI/CD push)
docker compose -f docker-compose.prod.yml pull

# Jalankan semua service
docker compose -f docker-compose.prod.yml up -d

# Cek status
docker compose -f docker-compose.prod.yml ps

# Lihat logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

---

## 5. Konfigurasi Nginx (Reverse Proxy)

Arahkan domain `habit.senlabs.web.id` ke port `3001` (frontend) dan `/api` ke port `8081` (backend).

Contoh konfigurasi Nginx:

```nginx
server {
    listen 80;
    server_name habit.senlabs.web.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name habit.senlabs.web.id;

    ssl_certificate     /etc/letsencrypt/live/habit.senlabs.web.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/habit.senlabs.web.id/privkey.pem;

    # API → backend port 8081
    location /api/ {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Frontend → port 3001
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. Alur Deploy Otomatis

Setiap `git push` ke branch `master`/`main`:

1. **CI** — lint, typecheck, build, test (backend + frontend)
2. **CD** (hanya jika CI lulus):
   - Build Docker image backend + frontend
   - Push ke GHCR (`ghcr.io/USERNAME/REPO/habit-*:sha-xxxxxxx`)
   - SSH ke VPS → `docker compose pull` → `docker compose up -d --no-deps`

### Release dengan semver tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```
Image akan di-tag `v1.0.0` + `1.0` di GHCR.

---

## 7. Troubleshooting

### Image tidak ter-pull di VPS
```bash
echo "GITHUB_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin
```

### Cek port yang dipakai
```bash
sudo ss -tlnp | grep -E '3001|8081'
```

### Reset semua data (HATI-HATI: data hilang!)
```bash
docker compose -f docker-compose.prod.yml down -v
```
