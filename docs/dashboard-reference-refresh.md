# Revisi dashboard mengikuti referensi pengguna — 2026-11-13

Status: implementasi dan pemeriksaan browser selesai. Acuan visual terbaru adalah `design-reference/dashboard-nov13.png`, menggantikan arah sage/kertas hangat yang sebelumnya dirasa kurang sesuai oleh pengguna.

## Permintaan dan hasil

- Dashboard mengikuti contoh pengguna: banner hijau dengan ilustrasi keluarga di kanan, shortcut hijau/oranye/ungu, agenda dan tugas sejajar, lalu strip “Sekilas keluarga” dengan empat tile pastel.
- Sidebar lebih ramping (208 px; ringkas 80 px), wordmark Habit, menu aktif emerald, ikon seragam, profil dalam kartu ringan, dan dekorasi latar bawah. Drawer mobile, collapse dan akses keyboard dipertahankan.
- Topbar tidak lagi menampilkan “Ruang keluarga” atau judul halaman. Semua menu memakai satu h1 di konten halaman. Topbar hanya menyediakan drawer, pengingat tugas aktual, tema dan menu akun.
- Font diganti menjadi Plus Jakarta Sans variable lokal, dengan lisensi OFL. Isi bawaan 13 px, ukuran token sm 13 px/base 14 px, judul halaman 18–22 px, heading sapaan 25–28 px. Tidak memakai CSS zoom atau mengunci zoom browser.
- Ukuran dan jarak dikompakkan. Pada desktop pendek (tinggi <=800 px), banner/kartu/jarak memakai varian ringkas agar isi utama muat di layar awal. Kontrol perangkat sentuh mempertahankan ukuran lebih lapang.
- Tombol utama emerald/pill, secondary hijau lembut, serta shortcut outline pastel. Primitive Button disesuaikan karena pengguna secara eksplisit meminta perbaikan tombol; tidak menambah library.
- Tiga aset baru dibuat dengan built-in imagegen lalu diekspor ke WebP: `family-banner-v3.webp`, `calendar-empty-v3.webp`, `task-empty-v3.webp` di `frontend/public/illustrations/`. Sumber PNG disimpan di `docs/design-reference/`.
- Metrik tetap berasal dari API. Pengeluaran pada Sekilas keluarga berlabel bulan ini/IDR sesuai summary bulanan; jumlah menu berasal dari meal plans hari lokal. Request gagal tidak disajikan sebagai angka nol.

## Verifikasi

Build produksi 19 halaman, lint, TypeScript dan enam tes logika lulus. Pemeriksaan browser lulus: 46 skenario, tanpa error runtime; delapan audit axe terpilih tanpa pelanggaran. Empat ukuran desktop (1040×600, 1228×620, 1366×768, 1440×900) terverifikasi; 20 pemeriksaan menu memastikan satu h1. PWA manifest, kontrol service worker dan fallback offline juga lulus pada sesi ini. Script browser `frontend/scripts/ui-qa.cjs` memiliki mode `HABIT_QA_REFERENCE=1` untuk data kosong/terisi, light/dark, 375/390/768/1040/1440 px; satu judul per halaman; font/density; sidebar; popover; dan audit axe terpilih. Hasil final: `qa/reference-results.json`.

Contoh screenshot akhir:

- `qa/reference-dashboard-empty-1440-light.png`
- `qa/reference-dashboard-1040x600.png`
- `qa/reference-dashboard-1366x768.png`
- `qa/reference-dashboard-empty-390-light.png`

Browser memakai data simulasi, bukan data keluarga pengguna. Tidak mengubah backend/schema atau melakukan commit/deployment.

## Prompt aset

### hero

> Reference image is visual direction only, not an edit target. Produce ONLY an illustration asset, absolutely no UI, text, letters, numbers, logos, buttons or watermark. Match the bright, friendly hand-drawn 2D illustration style in the reference: clean thin dark green outlines, soft flat watercolor-like color fills, fresh emerald and mint greens, warm cream, peach, touches of lavender. Polished charming editorial illustration, no 3D, no photorealism. A wide landscape 3:1 decorative family scene for a dashboard banner: a mother in a soft lavender hijab, a smiling father in an olive shirt with glasses, and their daughter, sitting closely on a cream sofa reading an open book together. A few potted green plants, a curtain and a small stack of books frame the scene. Cozy sunlit home atmosphere. Family occupies right two thirds, books and a small plant on the left. All faces and book fully visible, ample margin around heads. Genuine transparent background outside the characters, sofa, plants, and curtain. No enclosing rectangular panel; organic vignette edges fade to transparency. This will be placed on the RIGHT half of a green-tinted hero banner; horizontal and compact, not tall.

### calendar

> Reference image is visual direction only, not an edit target. Produce ONLY an illustration asset, absolutely no UI, text, letters, numbers, logos, buttons or watermark. Match the bright, friendly hand-drawn 2D illustration style in the reference: clean thin dark green outlines, soft flat watercolor-like color fills, fresh emerald and mint greens, warm cream, peach, touches of lavender. Polished charming editorial illustration, no 3D, no photorealism. Single small decorative vignette: a standing desk calendar with a green checkmark on its blank page, a tiny green leaf and two small cheerful accent lines, sitting on a soft pale mint oval wash. Centered compact composition. Genuine transparent background outside this vignette. Plenty of padding. Clear and legible at 120px. No date numbers or words.

### tasks

> Reference image is visual direction only, not an edit target. Produce ONLY an illustration asset, absolutely no UI, text, letters, numbers, logos, buttons or watermark. Match the bright, friendly hand-drawn 2D illustration style in the reference: clean thin dark green outlines, soft flat watercolor-like color fills, fresh emerald and mint greens, warm cream, peach, touches of lavender. Polished charming editorial illustration, no 3D, no photorealism. Single small decorative vignette: a cream clipboard checklist with two simple green checkmarks and short blank lines, green clip at top, a small pencil beside it, and two cheerful yellow accent marks. Sits on a soft pale yellow oval wash. Centered compact composition. Genuine transparent background outside this vignette. Plenty of padding. Clear and legible at 120px. No letters or words.


## Perbaikan overlap sidebar

Offset konten dan padding halaman menggunakan `.app-content`/`.app-main` eksplisit, diselaraskan dengan sidebar 208/80 px. Pemeriksaan browser memastikan banner tidak masuk ke sidebar atau melewati gutter kanan. Bukti pada ukuran laporan pengguna: [1228×620](qa/reference-dashboard-1228x620.png).
