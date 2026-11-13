# Hasil redesign HABIT — 2026-11-13

Status: implementasi seluruh modul dan QA frontend lokal selesai. Build produksi lulus. Dokumen ini membedakan pengujian frontend dengan fixtures dari pengujian layanan nyata.

## Implementasi

- Fondasi sage/putih hangat, font Inter lokal berlisensi OFL, Geist Mono lokal, token permukaan/teks yang mendukung tema gelap. Zoom diperbolehkan; focus-visible dan reduced-motion tersedia.
- Menu terpusat, label konsisten, Sidebar 240/80 px, drawer mobile, kontrol tema nyata, profil menuju Pengaturan. Drawer ditutup saat berpindah ke desktop dan background inert selama terbuka.
- Dashboard: sapaan dengan ilustrasi 2D, agenda dan tugas hari ini, tugas terlambat, pengeluaran/anggaran aktual, pengingat semua profil anak, dan entri kenangan. Tidak memakai Rp3 juta/fallback 40%, label mendesak berdasarkan ada-tidak tanggal, atau menyebut entri sebagai foto baru.
- Tugas: filter anggota, status mobile, kanban desktop, tanggal aktual, aksi selesai/edit/hapus dan mutation feedback. Kategori berbasis tebakan judul dan progress 60% buatan dihapus.
- Kalender: header dan kontrol konsisten, tanggal dapat diakses keyboard, error/retry, modal bersama.
- Makan: pemilih hari dan slot sarapan/siang/malam di HP; grid mingguan di layar lebar. Tambah/edit/hapus tetap memakai hook API existing.
- Keuangan/target: summary/status lebih jelas, jumlah transaksi dari summary seluruh bulan, kategori terbesar disortir, anggaran belum diatur/terlampaui dijelaskan. Filter, target, dana, dan daftar belanja dipertahankan.
- Liburan/detail: header ringkas menggantikan hero besar, palet seragam, tab scroll lokal, itinerary/budget/checklist/split bill/dokumen/anggota memakai alur existing. Semua modal memakai lifecycle bersama dan hapus meminta konfirmasi.
- Anak: header/tab/form/tabel/grafik mengikuti fondasi; kolom aksi tanpa fungsi dihapus, state request per tab dibedakan.
- Kenangan/dokumen: kartu responsif, nama panjang, tombol terlihat tanpa hover, empty state 2D, error/retry, upload tetap tersedia. Pending foto pada edit kenangan kini ikut diunggah; error upload diberi pesan.
- Pengaturan/auth: header, form, branding dan ilustrasi seragam. Kontrol tema tersedia, kode undangan/profil/anggota/logout tetap memakai data API. Indikator kuota/enkripsi dokumen yang tidak didukung data dihapus.
- Dialog bersama: portal, aria-modal/nama, inert background, fokus awal/Tab/Escape/pemulihan fokus, pembatas tinggi dan scroll. Label form/nama tombol ikon diperbaiki. Target kontrol umum minimal 44 px.

## Pemeriksaan otomatis

- `npm --prefix frontend test`: enam tes lulus (tanggal invalid, tanggal lokal, tugas kemarin/hari ini/besok/done/tanpa jadwal, event berlangsung/lintas hari/batas tengah malam, anggaran nol/belum diatur/terlampaui).
- TypeScript dan lint: lulus, tanpa warning/error ESLint. Fungsi upload tak terpakai yang terungkap oleh formatter dihapus.
- `npm --prefix frontend run build`: lulus, menghasilkan 19 halaman; font tidak memerlukan akses Google Fonts saat build.
- Browser: **107 pemeriksaan**, tanpa error runtime dan tanpa overflow horizontal. Chrome headless dengan request API diintersep; data terisi/kosong/error, 375/390/768/1440 px, light/dark, keyboard drawer/modal, membuat/menyelesaikan tugas dan login. Hasil final mesin: `qa/browser-results.json`.
- Audit axe-core dibatasi pada button-name, label, aria-dialog-name, color-contrast, dan nested-interactive; ini bukan sertifikasi aksesibilitas menyeluruh. **29 audit bersih** (11 halaman × 2 tema, 7 dialog). Temuan kontras kode undangan dark, teks sekunder di sage, tanggal bulan lain, label destinasi, label tombol foto, dan tombol budget itinerary sudah diperbaiki.

## PWA

- Manifest terbaca tanpa error; warna tema/background, shortcut dan ikon tetap tersedia.
- Registrasi service worker eksplisit di root App Router memperbaiki setup lama yang hanya menyuntikkan registrasi pada entry Pages Router.
- `sw-push.js` existing kini benar-benar diimpor worker. Pengiriman push dari backend ke perangkat fisik belum diuji.
- Navigasi offline memakai halaman `offline.html` yang diprecache. Data keluarga dan navigasi menggunakan network; tidak menampilkan cache HTML akun sebagai data terbaru atau menjanjikan CRUD offline.
- Chrome membuktikan service worker mengontrol halaman, lalu mematikan jaringan untuk target halaman dan worker: navigasi mengembalikan HTTP 200 dari service worker dengan heading “Koneksi sedang terputus.” Bukti: `qa/pwa-results.json`, [screenshot offline](qa/pwa-offline.png).
- Build QA memakai `.next-qa` agar tidak bertabrakan dengan server development `.next` yang sedang digunakan. Tidak menghentikan server development milik pengguna.

## Mengulang pemeriksaan browser

Tidak menambah dependency aplikasi. Puppeteer/axe dipasang sementara di luar checkout:

```bash
npm install --prefix /tmp/habit-qa --no-save puppeteer-core axe-core
NEXT_BUILD_DIR=.next-qa npm --prefix frontend run build
mkdir -p frontend/.next-qa/standalone/.next-qa/static frontend/.next-qa/standalone/public
cp -a frontend/.next-qa/static/. frontend/.next-qa/standalone/.next-qa/static/
cp -a frontend/public/. frontend/.next-qa/standalone/public/
PORT=3100 HOSTNAME=localhost node frontend/.next-qa/standalone/server.js
# Terminal lain, dari root checkout:
HABIT_QA_MODULES=/tmp/habit-qa/node_modules node frontend/scripts/ui-qa.cjs
HABIT_QA_MODULES=/tmp/habit-qa/node_modules node frontend/scripts/pwa-qa.cjs
```

Script memakai data fiktif dan mengintersep API. `CHROME_PATH` dapat menunjuk Chrome lokal; `HABIT_QA_URL` mengganti origin QA. Jangan menafsirkan fixtures sebagai pembuktian CRUD backend nyata.

## Screenshot

Screenshot di `docs/qa/` memakai data keluarga fiktif, bukan data akun pengguna. Contoh hasil:

- [Dashboard desktop](qa/dashboard-1440-light.png)
- [Dashboard HP](qa/dashboard-390-light.png)
- [Dashboard gelap](qa/dashboard-390-dark.png)
- [Tugas HP](qa/tasks-390-light.png)
- [Makan HP](qa/meals-390-light.png)
- [Anak HP](qa/kids-390-light.png)
- [Login desktop](qa/login-1440-light.png)
- [Detail liburan HP](qa/trips-trip-1-390-light.png)

## Batas pengujian

Backend, database, dan schema tidak diubah. Browser fixtures memverifikasi render dan request frontend; hasil ini tidak membuktikan penyimpanan backend nyata, upload ke MinIO/R2, email/Google OAuth langsung, atau push notification terkirim. Instalasi PWA dan keyboard perangkat iOS/Android fisik tetap memerlukan smoke test pada environment integrasi/HTTPS. Tidak membuat commit, push, atau deployment.

## Pembaruan logo — 2026-11-13

Atas permintaan pengguna, logo diganti dengan monogram H/rumah sage–ivory. Branding login/sidebar, favicon, ikon Apple/PWA, maskable, notifikasi dan offline mengikuti aset v2. Build/lint/typecheck serta lima pemeriksaan browser logo dan pemeriksaan PWA ulang lulus. Lihat [spesifikasi, prompt dan screenshot logo](logo.md). Screenshot matriks redesign di atas tetap merekam batch sebelum penggantian logo.
