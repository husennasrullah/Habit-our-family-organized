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
