# Logo aktif Habit — Hadir Bersama v3

Penerapan 2026-11-13 atas persetujuan pengguna. Identitas aktif memakai H yang merangkul dan titik amber, emerald #007F5B serta mint #93E2BF pada tema gelap. Wordmark bulat-tebal tetap 84×25 px; simbol native SVG 40×40 px menjaga proporsi. Titik i mengikuti warna huruf pada lockup agar aksen amber hanya berada di simbol.

Dipakai pada Sidebar/auth, halaman offline, banner pemasangan, metadata favicon/Apple/PWA, shortcut dan notifikasi. Judul tab: **Habit — Keluarga lebih dekat**. Nama instalasi dan Apple: **Habit**. Tagline: **Kebiasaan kecil. Keluarga lebih dekat.**

Sumber desain dan panduan: [brand/habit-v3/README.md](brand/habit-v3/README.md). Komponen `HabitMark.tsx`/`HabitWordmark.tsx` menyajikan vektor pada UI. `node frontend/scripts/generate-brand-icons.cjs` mengekspor PNG/ICO dan lockup offline dari SVG yang disetujui. Ikon maskable menjaga foreground dalam lingkar aman diameter 80%; badge notifikasi memakai siluet putih transparan 96 px.

URL `habit-v3-*` dan versi manifest `20261113-hadir3` memisahkan aset baru dari cache lama. Manifest id `/dashboard`, start_url dan scope dipertahankan. Manifest/sw/sw-push/favicon diminta revalidasi; registrasi service worker memakai updateViaCache none. Pembaruan ikon launcher yang sudah terpasang tetap mengikuti browser/OS.

Verifikasi lulus: 22 tes frontend, build produksi/lint/typecheck 19 halaman, PNG/ICO/maskable/badge, serta 16 pemeriksaan browser/PWA tanpa error runtime/overflow. Offline fallback HTTP 200 dari worker dengan lockup baru selesai dimuat. Bukti `docs/qa/brand-v3-assets.json`, `brand-v3-results.json` serta screenshot `brand-v3-*`. Script browser: `node frontend/scripts/brand-v3-qa.cjs` (atau alias `logo-qa.cjs`). Bagian di bawah adalah arsip v2 dan proses eksplorasi.

---

# Logo HABIT v2 — 2026-11-13

Pengguna meminta saran dan penggantian logo. Arah yang dipilih adalah monogram H yang menyatu dengan atap rumah: huruf awal HABIT, rumah sebagai ruang keluarga, bentuk sederhana agar terbaca pada ukuran kecil. Sage dan ivory mengikuti redesign aplikasi; wordmark HABIT tetap berupa teks HTML.

Logo dibuat dengan built-in `imagegen`, lalu diekspor ke ukuran platform memakai Sharp yang sudah menjadi dependency proyek. Tidak menambah dependency runtime. Gambar sumber ada di `docs/brand/habit-logo-source-v2.png`; konsep awal disimpan di `docs/brand/habit-logo-concept-v1.png`.

## Aset dan pemakaian

| Aset | Pemakaian |
|---|---|
| `frontend/public/icons/habit-mark-v2.png` | Sidebar, branding login desktop/mobile, dan halaman offline |
| `habit-v2-32.png`, `habit-v2-48.png` | Metadata favicon |
| `frontend/app/favicon.ico` | Ikon tab browser; PNG 16/32/48 px dalam container ICO |
| `habit-v2-180.png` | Apple touch icon |
| `habit-v2-192.png`, `habit-v2-512.png` | Ikon PWA, shortcut, banner pemasangan dan notifikasi |
| `habit-v2-maskable-192.png`, `habit-v2-maskable-512.png` | PWA maskable dengan padding tambahan; bentuk utama berada dalam lingkar aman 40% |

Semua PNG turunan ada di `frontend/public/icons/`. URL versi baru dipakai agar manifest/metadata tidak mengandalkan URL ikon lama yang mungkin sudah dicache. Aset lama tetap tersedia sebagai arsip. Avatar pengguna tidak diganti.

Regenerasi ukuran dari sumber tersimpan:

```bash
node frontend/scripts/generate-brand-icons.cjs
```

## Prompt pembuatan

> Use case: logo-brand. Create one polished, original app icon for HABIT, a warm minimalist family organization app. Single distinctive symbol: a bold rounded capital H whose two upright pillars and simple pitched roof read together as a welcoming house. The H crossbar is clear; the roof joins the uprights into one coherent, balanced architectural monogram. Geometric, warm, restrained, professional, optical symmetry and generous negative space, thick consistent forms legible at 24px. Exactly two flat colors: full-bleed square background dark muted sage #426653 and foreground symbol warm ivory #F6F5F1. Center the complete symbol within the central 60 percent of the square so it stays inside the maskable app icon safe zone. No words, no extra letters, no people, no hearts, no leaves, no dots, no surrounding border, no gradients, no texture, no shadows, no mockup, no perspective, no outer rounded corners; the artwork itself is a full-bleed opaque square. Clean vector-style crisp edges. Output a single large square icon, not a presentation sheet.

## Prompt penyempurnaan

> Refine this existing HABIT logo into a strictly flat, crisp brand asset. Preserve the exact existing H-house silhouette, stroke proportions, placement, and square canvas. Replace the entire mottled green background with one perfectly uniform solid sage color #426653. Replace the foreground shape with one perfectly uniform solid ivory #F6F5F1. Absolutely remove all grain, noise, paper texture, shading, lighting, vignettes and color variation. Smooth vector-like antialiased edges only. Do not add any text, extra symbol, frame or rounded outside corners. This is a production icon, not a photographic rendering. Preserve the original composition.

Sumber generator berupa raster; URL warna di prompt adalah arahan warna, bukan klaim bahwa setiap pixel hasil generasi memiliki nilai RGB identik.

## Verifikasi

- Dimensi seluruh delapan PNG dan struktur ICO lulus. Radius terjauh simbol maskable 0.314 (192 px) dan 0.312 (512 px), di dalam batas aman 0.4.
- Build produksi (19 halaman), lint dan TypeScript lulus.
- Lima pemeriksaan browser: branding login pada 390/1440 px dan tema light/dark, serta sidebar dashboard; tanpa error runtime. Keempat ikon manifest dan favicon HTTP 200.
- PWA diperiksa ulang: manifest tanpa error, worker mengontrol halaman, fallback offline HTTP 200 dari worker.
- Bukti: [hasil mesin](qa/logo-results.json), [login desktop](qa/logo-login-1440-light.png), [login HP](qa/logo-login-390-light.png), [dashboard](qa/logo-dashboard-1440.png).

Tool built-in imagegen dipakai untuk pembuatan dan penyempurnaan; Sharp hanya mengekspor ukuran/padding platform. Belum commit atau deploy.

## Pembaruan wordmark dan cache PWA — 2026-11-13

Wordmark sidebar diperkuat menjadi 24 px, weight 800, tracking -0.9 px dan stroke 0.3 px; tagline tetap ringan. Ikon PWA tetap berasal dari logo v2 yang sama dengan sidebar, dengan URL berparameter `v=20261113-logo2` untuk memutus pemakaian URL cache lama. Manifest memiliki id `/dashboard` (identitas lama berdasarkan start_url), keluar dari precache, menggunakan NetworkOnly dan HTTP no-cache; worker diperbarui dengan updateViaCache none. Metadata Apple juga memakai URL ikon berversi. Ikon launcher aplikasi yang sudah terpasang mengikuti jadwal pembaruan browser/OS; instalasi ulang dapat diperlukan jika OS tetap menampilkan ikon lama setelah versi baru tersedia.


## Konsep SVG v3 — Hadir Bersama (2026-11-13)

Pengguna meminta eksplorasi ulang berdasarkan nilai aplikasi melalui skill SVG Logo Designer. Pilihan utama menggabungkan H, hubungan melengkung seperti rangkulan dan titik amber; emerald mengikuti UI aktif. Paket desain, alternatif, panduan serta pratinjau tersedia di [habit-v3/README.md](brand/habit-v3/README.md), dengan sumber generator `frontend/scripts/design-habit-logo-v3.cjs`. Seluruh SVG berupa vektor mandiri. Paket desain ini kemudian disetujui dan diterapkan sebagai identitas aktif v3 sebagaimana catatan di atas.
