# Habit — Hadir Bersama

Identitas visual berdasarkan fungsi aplikasi, 2026-11-13. Dibuat dengan skill SVG Logo Designer; semua simbol digambar sebagai geometri vektor, bukan gambar hasil generasi atau font ikon.

## Kesimpulan brand

Habit membantu keluarga membentuk kebiasaan kecil yang membuat hidup bersama lebih teratur dan lebih dekat. Kalender, tugas, keuangan, jadwal makan, tumbuh kembang anak, perjalanan, kenangan dan dokumen merupakan bagian dari satu keseharian keluarga. Identitas paling relevan menggabungkan kedekatan keluarga dan kebiasaan sehari-hari.

Nilai yang diturunkan dari aplikasi: kebersamaan, kepedulian, keteraturan, kesinambungan dan rasa aman dalam ruang privat keluarga. Karakternya ramah, tenang, praktis dan hangat. Nama utama tetap **Habit**, mengikuti judul produk dan arah lettering yang baru disetujui pengguna.

## Pilihan utama: Hadir Bersama

- Dua batang membulat membentuk **H**, inisial Habit. Hubungan melengkung di tengah mengisyaratkan rangkulan dan kebersamaan; bentuknya tetap sederhana pada ikon kecil.
- Titik amber menjadi fokus hangat: sesuatu yang dijaga bersama, satu langkah kecil atau momen sehari-hari. Maknanya tidak membatasi bentuk keluarga atau jumlah anggotanya.
- Emerald #007F5B mengikuti navigasi/tombol utama aplikasi. Amber #F5B942 memberi kehangatan; cream #FAF8F2 dan forest #183C32 melengkapi penerapan.
- Lettering bulat-tebal yang sudah diminta pengguna dipertahankan sebagai kontinuitas. Pada kombinasi ikon+nama, titik pada i mengikuti warna huruf agar aksen amber terpusat di simbol; pada wordmark mandiri, titik i memakai amber.
- Nama dibuat lebih rendah daripada simbol: tinggi tinta wordmark sekitar 40 unit dan simbol sekitar 44 unit pada horizontal lockup. Ruang antar unsur dijaga; tidak mengulang masalah tulisan yang mendominasi ikon.

Tagline komunikasi: **Kebiasaan kecil. Keluarga lebih dekat.** Tagline UI lama “Ruang keluarga kita” tetap dapat digunakan untuk sidebar; tagline bukan bagian wajib logo kecil.

## Alternatif yang disediakan

1. **Ritme Rumah**: atap dan H, mempertahankan metafora ruang keluarga dari logo sebelumnya.
2. **Tumbuh Bersama**: dua bentuk organik yang tumbuh dari satu pusat, memberi penekanan pada perkembangan dan kebiasaan.

Hadir Bersama dipilih karena menghubungkan nama Habit dengan relasi keluarga dalam satu tanda yang tetap sederhana. Kedua alternatif disediakan sebagai pembanding arah visual, bukan identitas yang dipakai bersamaan.

## File utama

- `habit-hadir-bersama-horizontal-color.svg`: logo utama, latar transparan.
- `habit-hadir-bersama-icon-color.svg`: simbol tanpa tile.
- `habit-hadir-bersama-stacked-color.svg`: susunan vertikal.
- `habit-hadir-bersama-wordmark-color.svg`: nama tanpa simbol.
- `habit-hadir-bersama-app-color.svg`: ikon aplikasi dengan tile emerald membulat.
- `habit-hadir-bersama-pwa.svg`: tile penuh tanpa sudut luar membulat untuk maskable/PWA.
- `habit-logo-primary.png`, `habit-app-icon-512.png`: ekspor raster utama.
- `habit-logo-presentation.png`: tiga konsep dan pilihan utama.
- `habit-logo-usage.png`: versi terang/gelap, proporsi sidebar, dan ikon kecil.

Paket memuat 25 SVG produksi: lima layout utama × empat varian warna, empat SVG alternatif, dan satu sumber PWA. Selain itu terdapat dua board presentasi SVG/PNG. Varian `color` untuk putih/cream, `dark` untuk latar forest, `mono` untuk satu warna gelap, dan `white` untuk satu warna putih di atas latar gelap. Varian app selalu diberi tile yang kontras; varian transparan white memang ditujukan untuk latar gelap.

## Penggunaan

- Gunakan horizontal lockup untuk header/branding; gunakan simbol saja untuk navigasi ringkas dan launcher.
- Ukuran simbol minimum yang diperiksa: 16 px; anjuran untuk UI: 24–34 px. Horizontal lockup sebaiknya setidaknya 120 px lebar. Detail tetap berbasis vektor sehingga dapat diperbesar.
- Sisakan ruang kosong minimum setengah lebar batang simbol di sekeliling tanda; untuk materi promosi gunakan ruang yang lebih lega seperti board.
- Pertahankan rasio viewBox, bentuk, jarak dan warna. Jangan menambahkan bayangan, bevel, tekstur atau memadukan logo dengan detail modul.
- Seluruh foreground sumber PWA berada di lingkar aman pusat berdiameter 80% tile; jangan memangkas simbol ke tepi launcher.
- Nama digambar dengan outline vektor dan tidak bergantung pada instalasi font atau request eksternal. SVG memiliki title/desc untuk aksesibilitas.

Reproduksi dari root: `node frontend/scripts/design-habit-logo-v3.cjs`. Sharp sudah tersedia sebagai dependency proyek. Script memakai outline lettering Habit yang tersimpan di komponen brand sebagai sumber tipografi; artefak SVG hasil ekspor mandiri dan tidak memiliki ketergantungan tersebut saat digunakan.

## Status

Paket desain dan pratinjau telah dibuat dan diperiksa secara visual pada latar terang/gelap dan ukuran 16/24/34/64 px. Hasil validasi teknis ada di `validation.json`. Pengguna menyetujui konsep dan meminta penerapan di seluruh lini. Simbol/lettering kini diterapkan melalui komponen brand bersama; metadata, favicon, Apple/PWA, shortcut, offline, install prompt dan push menggunakan v3. Regenerasi aset platform memakai `node frontend/scripts/generate-brand-icons.cjs`. Judul tab menjadi “Habit — Keluarga lebih dekat”; id manifest tetap `/dashboard`. Tidak ada perubahan fitur, database atau dependency runtime.
