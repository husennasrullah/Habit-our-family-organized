# Pengaturan, keluarga, dan sesi akun

## Perilaku baru

Pengaturan menyediakan profil terbaru dari API, edit nama/warna/tanggal lahir, foto JPG/PNG maksimal 2 MB (maksimum 2048×2048 piksel, crop tengah lalu encode JPEG 256×256), nama keluarga, kelola role/keluarkan anggota, rotasi kode undangan, kontrol notifikasi Jadwal Makan, ganti password, dan logout perangkat ini. Dialog mengikuti maksimum 360 px, punya pending/error/focus trap, responsif dan mendukung tema gelap. Foto upload diakses melalui API privat dan dipakai bersama di profil/sidebar/topbar/leaderboard; foto Google tetap dipakai bila belum diganti.

Pengguna biasa hanya dapat mengedit profil sendiri. Admin dapat mengedit anggota dalam keluarga yang sama. Role, warna, nama dan tanggal divalidasi server. Mutasi keluarga mengunci baris keluarga, lalu memeriksa role aktual dari DB. Admin terakhir tidak dapat diturunkan atau dikeluarkan, termasuk dua aksi bersamaan. Mengeluarkan anggota melepaskan family_id, mengubah role ke member, mencabut semua sesi dan push keluarga; akun/login serta histori referensi data tetap ada. Penghapusan diri sendiri diblokir.

Hanya admin menerima kode undangan dari API keluarga/profil. Kode baru acak kriptografis, berlaku tujuh hari. Rotasi langsung mengganti kode lama; join memeriksa kode/expiry dalam transaksi. Kode existing mendapatkan masa berlaku tujuh hari saat kolom pertama diisi. Edit nama keluarga tidak memperpanjang masa berlaku kode.

## Sesi dan autentikasi

Migrasi tambahan `014_account_sessions.sql` / AutoMigrate menambah `auth_sessions`, expiry undangan, key foto dan pengikatan push ke sesi. Database menyimpan hash SHA-256 refresh token, bukan token mentah. Setiap login membuat sesi sendiri. Access JWT dan refresh JWT memiliki token_type berbeda, session_id, dan hanya HS256 diterima. Middleware menolak refresh sebagai bearer API dan memeriksa sesi/member aktif, menggunakan role/family terkini dari DB. Validasi sesi gagal tertutup; kegagalan DB sementara mengembalikan 503, tanpa dianggap sebagai sesi dicabut oleh frontend.

Refresh memeriksa tipe, signature, expiry, hash dan sesi aktif di DB, lalu membuat access token dengan data anggota terbaru. Refresh token tetap untuk sesi tersebut sampai expiry aslinya (default tujuh hari), sehingga permintaan serentak/tab tidak saling membatalkan. Logout mencabut sesi tersebut dan record push perangkat; token access maupun refresh langsung tidak bisa dipakai untuk request baru. Request yang sudah lolos autentikasi sebelum pencabutan dapat selesai. Ganti password memverifikasi password saat ini, menyimpan bcrypt dan mencabut sesi/push perangkat lain; sesi perangkat saat ini dipertahankan. Akun Google-only diarahkan ke pengaturan keamanan Google.

Client memakai satu refresh bersama untuk mount/401/onboarding, memperbarui token serta profil, dan memeriksa versi state agar refresh yang selesai terlambat tidak menghidupkan akun setelah logout. Gangguan jaringan/503 tidak otomatis logout. Logout yang gagal di server mempertahankan state agar dapat dicoba ulang; setelah sukses, cache query dan token lokal dibersihkan. Tab lain ikut keluar melalui storage event. Browser push unsubscribe bersifat best effort setelah record delivery server dinonaktifkan. Pengguna baru di browser yang sama mungkin perlu mengaktifkan ulang notifikasi.

Google OAuth memakai state acak per percobaan (cookie HttpOnly, SameSite=Lax, sepuluh menit), memverifikasi state dan verified email sebelum linking/login. Linking mengunci akun dan hanya memperbarui field identitas Google. Refresh cookie memiliki Path=/ dan Secure di APP_ENV=production. Callback frontend menghapus token dari URL/history sebelum mengambil profil. Alur transport callback masih memakai query token existing; pertukaran one-time code belum termasuk pekerjaan ini.

## API tambahan/perubahan

| Endpoint | Perilaku |
| --- | --- |
| `PUT /api/v1/family` | Edit nama keluarga, admin |
| `POST /api/v1/family/invite-code` | Rotasi kode tujuh hari, admin |
| `PUT /api/v1/family/members/:id` | Self/admin, validasi profil/role dan last-admin |
| `DELETE /api/v1/family/members/:id` | Detach anggota, bukan hapus akun; admin |
| `POST /api/v1/family/avatar` | Upload foto diri sendiri |
| `GET /api/v1/family/members/:id/avatar` | Foto privat, self atau keluarga sama |
| `PUT /api/v1/auth/password` | Password saat ini/baru, mencabut sesi lain |
| `POST /api/v1/auth/logout` | Cabut sesi sekarang; endpoint push opsional untuk cleanup |
| `POST /api/v1/auth/refresh` | Body refresh_token diprioritaskan; cookie sebagai fallback; response token+member |

## Transisi deployment

Pengguna dengan token lama harus login ulang satu kali karena token lama tidak memiliki tipe/sesi DB. Push lama tanpa session_id dinonaktifkan saat kolom diperkenalkan; pengguna perlu mengaktifkan notifikasi kembali setelah login. Ini disengaja agar subscription lama tidak terus menerima data setelah perpindahan akun. Tidak mengubah credentials/env, data keluarga asli, atau login Google di server selama QA lokal. Hotfix storage yang digabungkan menjaga API berjalan saat provider gagal atau kunci enkripsi tidak valid; operasi file/enkripsi terkait saja yang dinonaktifkan.

Tidak menambahkan sistem undangan email, akun anak tanpa email, 2FA, reset password via email, daftar perangkat, atau perubahan role policy seluruh modul lain. WebSocket existing tetap memvalidasi sesi saat handshake; koneksi yang sudah terbuka tidak mendapat mekanisme penutupan paksa baru. Avatar lama yang gagal dibersihkan setelah pergantian dicatat untuk operator; tidak mengklaim transaksi atomik antara DB dan object storage.

## Verifikasi

Tes Go/JWT, integrasi PostgreSQL schema temporer, dan frontend mencakup self/admin/family isolation, last-admin serentak, invite rotate/expiry, role aktual, batas token access/refresh, pencabutan per perangkat, password, detach akun, validasi foto dan SQL 014 idempoten. Frontend menguji refresh bersama dan hasil refresh terlambat setelah logout. Browser fixture mencakup form/simpan/error, clipboard, foto privat, kode/anggota/password/logout, role biasa/Google/tanpa keluarga, ukuran 375/390/768/1440 dan tema terang/gelap. Bukti di `docs/qa/settings-modern-results.json`; alur OAuth Google dan push perangkat fisik belum diuji langsung dengan akun/perangkat nyata.

Reproduksi: `cd backend && go test ./... && go vet ./...`; set `HABIT_TEST_DATABASE_URL` untuk tes integrasi terisolasi. Build frontend terisolasi `.next-qa`, jalankan port 3100, lalu `node frontend/scripts/settings-qa.cjs` dari root. Audit menggunakan axe-core 4.10.3 lokal melalui `HABIT_AXE_PATH` atau `/tmp/habit-settings-axe.min.js`. Semua API browser memakai fixture dan service worker dibypass khusus pengujian.

Hasil akhir: seluruh tes/vet backend termasuk integrasi PostgreSQL terisolasi lulus; 23 tes frontend, build produksi 19 halaman/lint/typecheck lulus. Browser: 32 pemeriksaan dan enam audit axe terarah bersih tanpa runtime error atau overflow.
