# Landing page Habit

Implementasi 16 November 2026, sesuai pilihan Next.js + Tailwind. Source di `landing/` dalam repo aplikasi yang sama, dengan package-lock dan build terpisah. Panduan menjalankan dan deployment tersedia di `landing/README.md`.

## Tampilan dan perilaku

Identitas emerald/cream, logo asli, Plus Jakarta Sans lokal, ilustrasi keluarga, hero preview HTML, lima tab fitur dengan screenshot fixture, rutinitas keluarga, cara mulai, FAQ, dan CTA menuju https://habit.senlabs.web.id. Semua preview menggunakan data contoh; tidak menyajikan data keluarga production. Menu mobile mendukung Escape dan klik luar; tab mendukung panah, Home/End. FAQ memakai elemen details native. Reduced motion, skip link, fokus keyboard dan metadata bahasa Indonesia tersedia.

Tidak menambahkan pricing atau billing; ide monetisasi tetap ditunda di `monetization-ideas.md`. Tidak membuat statistik/testimoni, endpoint kontak, atau klaim fitur recurring/reminder yang belum tersedia.

## Verifikasi

- `npm run typecheck` dan `npm run build` lulus, juga dengan Node 20.19.6 sesuai mayor CI.
- Browser Chrome pada lebar 360, 390, 768, 1440 dan 1920: tidak ada overflow horizontal, gambar gagal dimuat, error runtime, atau temuan axe WCAG A/AA yang diperiksa. Pemeriksaan otomatis bukan jaminan kepatuhan aksesibilitas menyeluruh.
- Tautan CTA, navigasi anchor, menu mobile (Escape dan klik luar), kelima tab/gambar, navigasi keyboard tab, FAQ dan reduced motion lulus pemeriksaan.
- Bukti lokal: `docs/qa/landing-checks.json`, `docs/qa/landing-390.png`, `docs/qa/landing-1440.png`. Screenshot direview di desktop dan ponsel.
- YAML workflow lolos parse; CI GitHub sesudah push harus diperiksa terpisah.

## Hosting dan tindak lanjut

Versi owner-private diterbitkan melalui plugin Sites: https://habit-hadir-bersama.outerrhubarb1.chatgpt.site (deployment berhasil dikonfirmasi oleh layanan). Identitas tersimpan di `landing/.openai/hosting.json`; tidak menyimpan kredensial. Publikasi memakai salinan sementara source landing agar remote GitHub repo utama tidak berubah. Source kerja utama tetap monorepo ini.

Domain publik landing belum dipilih. Domain aplikasi tidak diubah. Setelah domain ditentukan, konfigurasi DNS/HTTPS/hosting static `landing/out/`, lalu canonical/sitemap/Open Graph dengan domain tersebut. Workflow landing membangun artefak secara independen; belum melakukan deployment domain kustom. Workflow aplikasi melewati perubahan landing/dokumentasi saja; perubahan konfigurasi CI/CD sendiri tetap memicu pemeriksaan/build aplikasi dan tag rilis mengikuti perilaku sebelumnya.

## Pemolesan visual — 16 November 2026

Menindaklanjuti masukan area putih terlalu banyak dan proporsi kurang seimbang: hero memakai gradasi mint/amber dengan heading tiga baris, header dan jarak bagian dipadatkan, preview desktop diluruskan. Tiga rutinitas memakai panel amber/mint/lavender. Bagian fitur memakai latar mint serta panel preview terbingkai; cara mulai menjadi hijau gelap dengan CTA amber; ilustrasi keluarga memakai panel hangat dan FAQ memakai baris berwarna lembut. Identitas, tautan aplikasi dan interaksi dipertahankan, tanpa dependency baru.

Pada fixture tampilan 1440 px, tinggi halaman berkurang dari 5209 menjadi 4657 px; pada 390 px dari 6060 menjadi 5850 px. Screenshot penuh disimpan pada `docs/qa/landing-polish-1440.png` dan `landing-polish-390.png` dan telah direview. Hasil pemeriksaan `landing-polish-checks.json`: lima viewport 360/390/768/1440/1920 tanpa overflow horizontal, gambar gagal, error runtime atau temuan axe WCAG yang diperiksa. Menu Escape/klik luar, keyboard tab, kelima gambar fitur, FAQ, target anchor/CTA dan reduced motion tetap lulus. Typecheck dan build produksi dengan Node 20.19.6 lulus. Perubahan source hanya `landing/app/page.tsx` dan `globals.css`; aplikasi utama/backend tidak diubah. Versi privat diperbarui melalui Site yang sama setelah verifikasi.

## Penulisan ulang konten — 16 November 2026

Skill copywriting diterapkan pada isi halaman dan tab fitur dengan sumber dari implementasi dan dokumentasi proyek. Fokus manfaat konkret untuk keluarga/orang tua: assignment tugas, jadwal vaksin dalam kalender, checkout belanja ke pengeluaran dan riwayat per anak. CTA utama diseragamkan menjadi Buka Habit; FAQ membahas undangan pasangan, perangkat, koneksi, peran dan vaksin manual. Tagline **Kebiasaan kecil. Keluarga lebih dekat.**, judul hero dan identitas brand dipertahankan sesuai arahan pengguna.

Dokumen editorial `docs/landing-copywriting.md` memuat copy final per bagian, anotasi, kandidat yang dipertimbangkan, metadata serta dasar/batas klaim. Tidak menambahkan harga, testimoni, angka pengguna, janji reminder otomatis, aplikasi native atau pencatatan offline. Deskripsi metadata diperbarui; judul SEO tetap. Perubahan CSS hanya membatasi panjang baris paragraf pengantar/penutup. Screenshot dan audit revisi ada di `docs/qa/landing-copy-*`; build/typecheck Node 20, pemeriksaan lima viewport serta interaksi tetap diperiksa. Membandingkan source membuktikan judul hero dan tagline existing tidak berubah.
