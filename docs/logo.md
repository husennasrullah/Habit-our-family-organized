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
