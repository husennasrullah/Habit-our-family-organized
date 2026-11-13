# Ilustrasi HABIT — 2026-11-13

Aset dibuat dengan tool built-in `imagegen`, disimpan di `frontend/public/illustrations/`, lalu dioptimalkan ke WebP memakai Sharp yang sudah ada. PNG sumber dipertahankan. Tidak memakai API key atau fallback CLI. Seluruh gambar dekoratif memakai alt kosong; teks dan aksi tetap HTML.

| Aset | Kegunaan |
|---|---|
| `family-planning.webp` (840 × 560, sekitar 112 KB) | Dashboard desktop dan branding auth |
| `calendar.webp` | Agenda kosong |
| `album.webp` | Kenangan kosong |
| `documents.webp` | Dokumen kosong |
| `travel.webp` | Liburan kosong |
| `family-planning.png`, `empty-state-sheet.png` | Sumber hasil generator; empat vignette dipotong per kuadran dari sheet |

## Prompt ilustrasi keluarga

> Use case: illustration-story. Asset type: small decorative illustration for HABIT family dashboard. Two parents and a child sitting together planning their day around a small table with an open blank planner. Warm inclusive Indonesian family. Editorial hand-drawn 2D pencil and ink lines, organic dark green outlines, subtle pencil texture, simple expressive faces, flat muted sage #426653, peach #F4D9C9, lavender #E6E0F1 and warm white. Compact balanced landscape composition, isolated on transparent background. No text, letters, logos, watermark, UI or detailed scenery. Quiet, minimal and charming, not 3D. Save a project usable PNG.

## Prompt empty state

> A square 2x2 asset sheet on transparent background, four separate small hand drawn pencil and ink 2D vignettes with ample space between: top left blank desk calendar with leaf; top right open photo album with heart; bottom left document folder and papers; bottom right travel suitcase and hat. No letters or numbers. Muted sage green, peach and lavender, dark green organic fine outlines, subtle pencil grain. Minimal editorial illustration, each vignette centered in its quadrant with generous transparent margins, no background scene.

Percobaan pertama sheet empty state timeout; prompt di atas adalah percobaan yang berhasil. Varian dan aset tambahan mengikuti bahasa visual ini.

Logo merek diperbarui terpisah pada 2026-11-13; lihat `logo.md` untuk monogram H/rumah, inventaris ukuran platform, dan prompt generator.
