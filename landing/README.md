# Habit landing page

Landing page berbahasa Indonesia dalam monorepo Habit. Next.js App Router + Tailwind CSS, ekspor statis, font Plus Jakarta Sans lokal. Semua tombol aplikasi mengarah ke **https://habit.senlabs.web.id** melalui `lib/site.ts`.

## Menjalankan

Gunakan Node.js 20.9+ dan npm. Dari root repo:

```bash
cd landing
npm ci
npm run dev
```

Buka http://127.0.0.1:3200. Untuk memeriksa hasil produksi:

```bash
npm run typecheck
npm run build
npm run preview
```

`npm run preview` hanya server pengujian lokal untuk folder `out/`; hentikan dengan Ctrl+C. Tidak memerlukan API, database, OAuth, ataupun kredensial aplikasi.

## Deployment terpisah

Root proyek hosting adalah `landing/`, perintah build `npm ci && npm run build`, direktori hasil `out/`. Hasil ekspor dapat dipasang pada hosting statis atau Nginx; tidak membutuhkan proses Node di production. Host harus menyajikan `index.html` pada URL direktori dan halaman `404.html` untuk alamat yang tidak ada. Semua aset memakai path root, sehingga deploy sebagai root domain/subdomain, bukan subfolder.

Domain landing belum ditentukan. Jangan mengganti domain aplikasi `habit.senlabs.web.id`. Setelah domain landing dipilih, konfigurasi DNS/HTTPS hosting dan tambahkan canonical, sitemap serta URL Open Graph menggunakan domain yang sudah benar. Tidak menyematkan canonical sementara atau localhost.

Workflow `.github/workflows/landing.yml` memeriksa tipe, membangun, dan menyimpan artefak `habit-landing-static`. Workflow belum memublikasikan artefak ke domain production. CI/CD aplikasi melewati perubahan yang hanya menyentuh landing dan dokumentasi; tag rilis tetap mengikuti workflow aplikasi.

## Konten dan aset

- `app/page.tsx`: narasi, FAQ, dan tombol aplikasi.
- `components/FeatureExplorer.tsx`: tab fitur, mendukung panah kiri/kanan, Home, dan End.
- `app/globals.css`: layout responsif, warna Habit, dan pengaturan reduced motion.
- `public/brand`, `public/illustrations`: aset identitas yang sudah ada dalam repo.
- `public/previews`: screenshot fixture aplikasi, menggunakan data contoh. Preview hero adalah ilustrasi HTML, bukan aplikasi interaktif.
- Font dan lisensinya ada di `app/fonts/`.

Tidak ada analytics, formulir pengumpulan data, harga langganan, atau klaim testimoni/statistik pengguna. Ide monetisasi tetap diarsipkan dalam `../docs/monetization-ideas.md`.
