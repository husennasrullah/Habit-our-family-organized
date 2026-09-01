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

---

## 1. Persiapan VPS

### Install Docker & Docker Compose
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt-get install -y docker-compose-plugin
```

### Buat user deploy (opsional, lebih aman dari root)
```bash
sudo adduser deploy
sudo usermod -aG docker deploy
```

### Clone repo ke VPS
```bash
git clone https://github.com/USERNAME/REPO_NAME.git /opt/habit
cd /opt/habit
cp .env.example .env
# Edit .env dengan nilai production
nano .env
```

---

## 2. GitHub Secrets

Buka **GitHub repo → Settings → Secrets and variables → Actions**, tambahkan:

| Secret | Nilai |
|--------|-------|
| `SSH_HOST` | IP VPS kamu (contoh: `1.2.3.4`) |
| `SSH_USER` | User SSH di VPS (contoh: `deploy` atau `ubuntu`) |
| `SSH_PRIVATE_KEY` | Private key SSH (isi dari `~/.ssh/id_rsa`) |
| `SSH_PORT` | Port SSH (default `22`) |
| `DEPLOY_PATH` | Path project di VPS (contoh: `/opt/habit`) |
| `FRONTEND_URL` | URL frontend production (contoh: `https://habit.keluarga.app`) |
| `NEXT_PUBLIC_API_URL` | URL API backend (contoh: `https://habit.keluarga.app/api/v1`) |
| `NEXT_PUBLIC_APP_URL` | Sama dengan `FRONTEND_URL` |
| `VAPID_PUBLIC_KEY` | VAPID public key untuk push notification |

### Generate SSH Key untuk Deploy
```bash
# Di mesin lokal
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/habit_deploy

# Tambahkan public key ke VPS
ssh-copy-id -i ~/.ssh/habit_deploy.pub deploy@VPS_IP

# Isi private key (habit_deploy) → paste ke GitHub secret SSH_PRIVATE_KEY
cat ~/.ssh/habit_deploy
```

---

## 3. Jalankan Production Pertama Kali

```bash
cd /opt/habit

# Edit semua env vars
cp .env.example .env && nano .env

# Pull image terbaru (setelah CI/CD push)
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

## 5. Alur Deploy Otomatis

Setiap `git push` ke branch `master`/`main`:

1. **CI** — jalankan lint, typecheck, build, test (backend + frontend)
2. **CD** (hanya jika CI lulus):
   - Build Docker image backend + frontend
   - Push ke GHCR (`ghcr.io/USERNAME/REPO/habit-backend:sha-xxxxxxx`)
   - SSH ke VPS → `docker compose pull` → `docker compose up -d --no-deps`

### Release dengan semver tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```
Image akan di-tag `v1.0.0` + `1.0` di GHCR.

---

## 6. GitHub Actions Permissions

Pastikan GHCR permissions aktif di repo:
- **Settings → Actions → General → Workflow permissions** → pilih **Read and write permissions**

---

## 7. Troubleshooting

### Image tidak ter-pull di VPS
```bash
# Login manual ke GHCR dari VPS
echo "GITHUB_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin
```

### Port conflict
```bash
# Cek port yang dipakai
sudo ss -tlnp | grep -E '80|443|8080'
```

### Reset semua data (HATI-HATI: data hilang!)
```bash
docker compose -f docker-compose.prod.yml down -v
```
