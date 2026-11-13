# Roadmap Redesign UI/UX HABIT

> Revisi pengguna 2026-11-13: dashboard/shell/tombol dibenahi ulang mengikuti screenshot baru; judul topbar dihapus, font dan density diganti. Acuan terbaru: `dashboard-reference-refresh.md`. Catatan penyelesaian tahap di bawah adalah hasil batch sebelumnya.

Tanggal: 2026-11-12
Status 2026-11-13: tahap 1–7 selesai untuk implementasi dan QA frontend lokal, termasuk PWA. Pengguna telah mengizinkan semua tahap sekaligus. Hasil dan screenshot: `ui-redesign-qa.md`.

## Tujuan dan arah desain

Membuat HABIT terasa sebagai satu aplikasi keluarga yang hangat, tenang, mudah dibaca, dan membantu pengguna menentukan tindakan berikutnya. Prioritasnya adalah kejelasan informasi, konsistensi interaksi, dan kenyamanan di HP.

Arah visual diperbarui mengikuti dua referensi pengguna: minimalis, ruang kosong yang lapang, dan ilustrasi pencil art / 2D. Palet awal: sage, putih hangat, tinta gelap, aksen peach/lavender. Spesifikasi aktif ada di [`ui-art-direction.md`](ui-art-direction.md). Gunakan Lucide untuk navigasi/aksi dan ilustrasi gambar tangan yang konsisten untuk sapaan, onboarding, dan empty state. Hindari emoji besar, gradient berulang, dan dekorasi pada setiap kartu.

Dokumen ini menjadi acuan redesign berikutnya. `dashboard-redesign-plan.md` dan mockup lama menjadi referensi historis; instruksi dekorasi atau tombol nonfungsional di sana tidak menjadi target baru.

## Cara kerja per tahap

1. Baca implementasi dan alur data bagian yang akan diubah.
2. Implementasikan satu tahap dengan lingkup yang bisa direview.
3. Jalankan pemeriksaan yang relevan; catat hasil nyata dan keterbatasannya.
4. Sajikan perubahan, screenshot desktop/mobile jika runtime tersedia, dan hal yang perlu ditinjau.
5. Perbarui status dokumen ini dan `agents.md`. Tunggu review pengguna sebelum tahap berikutnya, kecuali pengguna telah mengizinkan beberapa tahap sekaligus.

Tidak menambah library atau mengubah schema database untuk pekerjaan tampilan tanpa kebutuhan yang dibahas terlebih dahulu. Perubahan definisi data dibatasi pada koreksi informasi yang ditampilkan UI. Temuan backend yang lebih luas dicatat sebagai task terpisah.

## Tahap 1 — Baseline dan spesifikasi desain

Status: [x] Spesifikasi dan baseline source selesai; screenshot runtime belum tersedia. Lihat `ui-baseline.md`.

Lingkup:
- Jalankan frontend/backend jika environment mendukung; dokumentasikan hambatan tanpa mengklaim pemeriksaan visual sudah dilakukan.
- Ambil baseline dashboard, tugas, keuangan, liburan, dan login pada desktop dan mobile.
- Susun spesifikasi ringkas warna, ukuran teks, spacing, radius, lebar konten, ikon, dan state interaksi di `docs/design-system.md`.
- Terapkan preferensi di `docs/ui-art-direction.md`; rencanakan satu ilustrasi awal sebagai acuan aset beranda/auth/empty state. Pembuatan aset dilakukan ketika implementasi membutuhkan, bukan sekadar mengganti ilustrasi dengan emoji.
- Susun urutan isi dashboard dan pengelompokan navigasi. Samakan nama desktop/mobile: Beranda, Kalender, Tugas, Keuangan, Jadwal Makan.
- Tetapkan definisi metrik: tugas hari ini, terlambat, acara mendatang, pengeluaran, sisa anggaran; tangani anggaran yang belum diatur.

Selesai jika: arah visual, susunan informasi, dan definisi metrik tercatat; baseline atau batas verifikasi tersedia. Belum perlu merombak seluruh halaman.

## Tahap 2 — Fondasi UI dan navigasi

Status: [x] Fondasi, navigasi desktop/mobile, drawer, fokus, tema, dan komponen bersama diimplementasikan. Build produksi lulus; bukti browser ada pada laporan QA.

Lingkup:
- Rapikan token di `globals.css` dan `tailwind.config.ts`; utamakan teks isi 14–16 px, label terbaca, dan fokus keyboard yang jelas.
- Samakan layout global, judul halaman, lebar konten, spacing, tombol, input, kartu, badge, tab, empty/error/loading state.
- Buat komponen bersama di atas primitive UI yang ada; hindari pengubahan primitive tanpa kebutuhan.
- Rapikan Sidebar, Topbar, BottomNav: kelompok menu, ikon konsisten, label sama, state aktif jelas, drawer mobile dan mode collapse berfungsi.
- Beri konteks halaman pada topbar. Hapus indikator notifikasi palsu; elemen yang terlihat bisa diklik harus mempunyai aksi yang jelas.

Selesai jika: navigasi desktop/mobile berfungsi, fondasi konsisten, tidak ada scroll horizontal pada shell, dan elemen bersama nyaman digunakan dengan keyboard serta sentuhan.

## Tahap 3 — Dashboard sebagai acuan utama

Status: [x] Implementasi selesai; cakupan validasi dan batas pengujian tercatat di `ui-redesign-qa.md`.

Lingkup:
- Susunan utama: sapaan singkat → agenda/tugas hari ini dan aksi cepat → ringkasan keuangan → informasi keluarga sekunder.
- Kurangi banner, statistik berulang, tips dekoratif, dan elemen yang bersaing dengan tindakan utama.
- Terapkan pola komponen tahap 2. Setiap aksi cepat memakai alur yang tersedia, misalnya navigasi ke modul terkait.
- Koreksi label dan perhitungan: jangan menyebut pengeluaran sebagai sisa anggaran, memakai denominator Rp3 juta tetap, atau menampilkan progress 40% saat data kosong.
- Bedakan tugas hari ini, terlambat, dan tugas lain berdasarkan tanggal; format tanggal sesuai locale Indonesia dan batas hari lokal.
- Gunakan sumber data aktual untuk acara dan kenangan; jangan memakai jumlah yang dipotong untuk mewakili total atau jumlah foto baru.
- Tampilkan kondisi loading, data kosong, gagal memuat, serta mutation yang sedang berjalan.

Selesai jika: pengguna langsung menemukan kebutuhan hari ini, seluruh angka punya arti yang benar, tombol berfungsi, dan layout desktop/mobile dapat direview sebagai acuan modul berikutnya.

Validasi khusus: contoh tugas kemarin/hari ini/besok, anggaran nol/belum diatur/terlampaui, acara kosong, dan kegagalan request. Tambahkan tes logika hanya bila membantu memverifikasi perhitungan yang berubah.

## Tahap 4 — Aktivitas harian

Status: [x] Implementasi selesai; cakupan validasi dan batas pengujian tercatat di `ui-redesign-qa.md`.

Urutan pengerjaan: Tugas → Kalender → Jadwal Makan. Review setiap modul sebelum berpindah bila belum ada izin melanjutkan sekaligus.

Lingkup:
- Tugas: header/filter seragam, status mudah dibedakan, aksi tambah/edit/selesai jelas; tampilan mobile nyaman selain kanban desktop.
- Kalender: navigasi tanggal dan pilihan hari/minggu/bulan terbaca, event mudah dipilih, form mengikuti pola yang sama.
- Jadwal Makan: tampilan harian yang praktis di HP; grid mingguan di layar luas; aksi tambah/edit/hapus mudah ditemukan.
- Satukan modal/form: label, validasi, loading, Escape, fokus masuk/kembali, scroll, dan aksi hapus dengan konfirmasi.

Selesai jika: alur utama ketiga modul tetap berfungsi dan tidak membutuhkan hover atau layout lebar untuk aksi penting di HP.

## Tahap 5 — Keuangan dan liburan

Status: [x] Implementasi selesai; cakupan validasi dan batas pengujian tercatat di `ui-redesign-qa.md`.

Urutan pengerjaan: Keuangan dan target tabungan → daftar Liburan → detail Liburan.

Lingkup:
- Samakan ringkasan, filter, tab, format rupiah, progress, dan status anggaran.
- Kurangi filter bertingkat yang membingungkan; pisahkan tindakan utama dan informasi pendukung dengan jelas.
- Sesuaikan liburan dengan identitas HABIT; rapikan itinerary, checklist, rincian biaya/split bill, dan dokumen tanpa banner besar yang mendominasi.
- Pastikan tab dan nominal panjang tetap terbaca di HP.

Selesai jika: tambah/edit pengeluaran, kelola target tabungan, buat liburan, kelola itinerary/checklist/biaya/dokumen tetap berjalan; nominal dan progress konsisten dengan sumber data.

## Tahap 6 — Keluarga, konten, dan autentikasi

Status: [x] Implementasi selesai; cakupan validasi dan batas pengujian tercatat di `ui-redesign-qa.md`.

Urutan pengerjaan: Anak → Kenangan → Dokumen → Pengaturan → Login/Register/Onboarding.

Lingkup:
- Terapkan sistem visual dan pola form yang telah direview.
- Anak: tabel/grafik terbaca di HP, perpindahan profil dan pencatatan jelas.
- Kenangan: hierarki foto dan informasi, upload dan lightbox yang nyaman.
- Dokumen: aksi lihat/hapus tersedia tanpa hover, nama panjang dan empty state tertangani.
- Pengaturan: informasi akun/keluarga dan tindakan tersedia jelas; fitur profil baru bukan bagian otomatis redesign.
- Auth: identitas seragam, form sederhana, error jelas, alur Google OAuth dan onboarding tetap bekerja.

Selesai jika: semua halaman utama memakai pola yang sama dan alur yang sudah tersedia tetap berfungsi.

## Tahap 7 — Verifikasi dan penyelesaian

Status: [x] Build/lint/typecheck/6 tes logika lulus; 107 pemeriksaan browser tanpa error/overflow; 29 audit aksesibilitas terpilih bersih; manifest/service worker/fallback offline PWA lulus. Pengujian integrasi nyata dan perangkat fisik tercatat sebagai batas verifikasi.

Lingkup:
- Periksa lebar 375, 390, 768, dan 1440 px: overflow, teks panjang, keyboard layar, modal, safe area, serta bottom navigation.
- Periksa keyboard, focus visibility, nama tombol ikon, zoom, kontras teks, dialog, dan target sentuh; target umum kontrol sentuh 44 px.
- Periksa light/dark pada halaman dan overlay. Pastikan aktivasi tema benar-benar tersedia sebelum menyatakan dark mode terverifikasi.
- Jalankan lint, typecheck, dan build frontend. Jalankan pemeriksaan backend bila kode backend berubah.
- Periksa regresi login/logout, refresh sesi, navigasi, CRUD modul, upload, serta tampilan PWA menggunakan environment yang tersedia.
- Dokumentasikan screenshot akhir, hasil pemeriksaan, dan keterbatasan yang belum terselesaikan.

Selesai jika: pemeriksaan relevan lulus, tidak ada hambatan utama dalam alur yang diuji, dan hasil siap direview. Jangan menyatakan pengujian runtime lulus jika hanya membaca kode.

## Catatan audit awal

- Analisis awal dilakukan dari source frontend dan mockup lama `docs/ui-ux/menu dashboard.png`.
- Server lokal pada port 3000 belum tersedia saat audit; hasil render terkini belum diperiksa di browser.
- Temuan utama: hierarki dashboard, gaya modul yang berbeda, teks kecil, campuran ikon, nama navigasi tidak konsisten, kontrol tanpa aksi, serta definisi statistik yang keliru.

## Catatan progres

| Tanggal | Tahap | Hasil | Berikutnya |
|---|---|---|---|
| 2026-11-12 | Perencanaan | Roadmap bertahap disusun; belum ada perubahan UI | Tahap 1: baseline dan spesifikasi desain |
| 2026-11-12 | Referensi visual | Preferensi minimalis dan pencil art/2D dicatat; palet awal sage dipilih | Terapkan art direction pada tahap 1 dan review hasil dashboard pertama |

| 2026-11-12 | Tahap 1 + awal tahap 2 | Baseline/kontrak metrik tercatat, shell dan navigasi sage diimplementasikan; lint/typecheck lulus, HTTP login 200; build terhambat font loader | Selesaikan verifikasi fondasi, lalu dashboard dan ilustrasi tahap 3 |

| 2026-11-13 | Semua tahap implementasi | Seluruh halaman memakai fondasi sage/Inter lokal; dashboard dan data diperbaiki; modal/mobile/tema/ilustrasi diimplementasikan; build produksi lulus | Selesai; smoke test backend/Google OAuth/push/perangkat fisik saat environment integrasi tersedia |
