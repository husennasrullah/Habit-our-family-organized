# Dashboard Redesign Plan — Modern UI

## Overview

Redesign tampilan aplikasi HABIT agar sesuai mockup modern yang diberikan.
Perubahan mencakup: Dashboard page, Sidebar, Topbar, global layout/styling, dan halaman Auth (Login & Register).
Ilustrasi dekoratif tidak diimplementasikan — fokus pada layout, warna, typography, dan card style.

Scope:
- `frontend/app/(dashboard)/layout.tsx` — background global
- `frontend/components/layout/Sidebar.tsx` — sidebar redesign
- `frontend/components/layout/Topbar.tsx` — topbar redesign
- `frontend/app/(dashboard)/dashboard/page.tsx` — dashboard page redesign
- `frontend/app/globals.css` — CSS variable / typography tweaks jika diperlukan
- `frontend/app/(auth)/layout.tsx` — auth layout redesign (light card on light bg)
- `frontend/app/(auth)/login/page.tsx` — login form redesign
- `frontend/app/(auth)/register/page.tsx` — register form redesign

---

## Sub-Tasks

---

### Sub-Task 1 — Global Layout: Background & Spacing

**Intent**
Ubah background warna global layout dari `#F4F6F8` menjadi warna `#F0F2F5` (abu-abu terang seperti di mockup) dan pastikan main content area memiliki padding yang konsisten.

**Expected Outcomes**
- Background area konten terlihat abu-abu muda (bukan putih), kontras dengan card putih
- Padding main content area konsisten di desktop dan mobile

**Todo List**
- [ ] Di `layout.tsx`, ubah `bg-[#F4F6F8]` menjadi `bg-[#F0F2F5]`
- [ ] Pastikan padding `main` di layout sudah sesuai: `p-4 pb-24 lg:p-6 lg:pb-8`

**Relevant Context**
- File: `frontend/app/(dashboard)/layout.tsx` line 14

**Status**: [ ] pending

---

### Sub-Task 2 — Sidebar Redesign

**Intent**
Perbarui tampilan sidebar agar sesuai mockup:
- Active nav item: background teal muda dengan teks teal (bukan hanya border kiri)
- Item non-aktif: teks lebih gelap/jelas
- User info di bawah: tampilkan "lihat profil" sebagai link kecil
- Sidebar tetap fungsional (collapse/expand, mobile drawer)

**Expected Outcomes**
- Active item: `bg-teal-50 text-teal-600 font-semibold` dengan rounded pill style
- Non-active item: `text-neutral-600 hover:bg-neutral-100`
- User section bawah: nama + "lihat profil" kecil di bawahnya
- Border kiri aktif (indicator) dihapus, digantikan dengan background highlight penuh

**Todo List**
- [ ] Di `Sidebar.tsx`, ubah style active nav item dari border-kiri ke background highlight penuh
- [ ] Update style non-active item agar lebih readable
- [ ] Update user section: ganti `email` dengan text "lihat profil" berwarna teal
- [ ] Tambahkan tagline motivasi di bawah user section (misal: "Keluarga yang terorganisir...") — opsional, hanya di expanded state

**Relevant Context**
- File: `frontend/components/layout/Sidebar.tsx` lines 100–133 (nav items), 136–172 (user section)

**Status**: [ ] pending

---

### Sub-Task 3 — Topbar Redesign

**Intent**
Perbarui topbar agar sesuai mockup:
- Notif bell dengan badge merah
- Separator `|` antara bell dan avatar
- Avatar lebih besar/jelas
- Background tetap putih, border bawah tipis

**Expected Outcomes**
- Bell icon dengan dot merah (bukan teal)
- Separator vertikal `|` antara bell dan avatar
- Avatar 32px dengan ring teal

**Todo List**
- [ ] Ubah warna dot notifikasi dari `bg-primary-500` menjadi `bg-red-500`
- [ ] Tambahkan separator vertikal `|` antara bell dan avatar di `Topbar.tsx`
- [ ] Pastikan avatar dan bell sudah memiliki ukuran/spacing yang konsisten

**Relevant Context**
- File: `frontend/components/layout/Topbar.tsx` lines 42–59

**Status**: [ ] pending

---

### Sub-Task 4 — Stat Cards Redesign

**Intent**
Ubah tampilan 4 stat card di dashboard agar sesuai mockup:
- Layout card: icon + title di kiri atas, chevron arrow di kanan (bisa diklik ke halaman terkait)
- Sub-value tampil di bawah main value
- Setiap card memiliki warna left-border accent (teal, biru, merah, ungu)
- Card clickable (chevron navigate)

**Expected Outcomes**
- 4 stat card dengan left border accent berwarna sesuai card
- Chevron `>` di kanan yang navigate ke: `/tasks`, `/calendar`, `/budget`, `/memories`
- Icon + title di baris atas, nilai besar di bawah, sub-info di bawahnya
- Hover state ringan pada card

**Todo List**
- [ ] Update komponen `StatCard` di `dashboard/page.tsx` untuk layout baru
- [ ] Tambahkan prop `href` ke StatCard untuk navigasi
- [ ] Tambahkan left-border accent per card
- [ ] Ganti `div` menjadi wrapper yang dapat diklik (Link atau onClick dengan router)
- [ ] Update keempat instansi StatCard dengan warna border dan href yang sesuai

**Relevant Context**
- File: `frontend/app/(dashboard)/dashboard/page.tsx` lines 25–46 (StatCard), 102–136 (usage)

**Status**: [ ] pending

---

### Sub-Task 5 — Tugas Utama Section Redesign

**Intent**
Perbarui section "Tugas Utama" agar sesuai mockup:
- Header section: icon checklist + judul + "Lihat Semua" di kanan (teal)
- Task row: checkbox circle, judul, sub-text (due date / status), badge status di kanan, menu `⋮`
- Badge: MENDESAK (merah), BERJALAN (oranye/amber)
- Card dengan shadow ringan, rounded-xl

**Expected Outcomes**
- Tampilan task row lebih spacious dan clean
- Badge status jelas terbaca dengan warna yang sesuai mockup
- Tombol `⋮` (three dots) di kanan setiap task row (bisa non-fungsional untuk sekarang)

**Todo List**
- [ ] Update task row layout di `dashboard/page.tsx` — tambahkan `⋮` button
- [ ] Update badge style: MENDESAK = merah pill, BERJALAN = amber pill
- [ ] Pastikan sub-text due date tampil dengan format yang lebih clean

**Relevant Context**
- File: `frontend/app/(dashboard)/dashboard/page.tsx` lines 163–193

**Status**: [ ] pending

---

### Sub-Task 6 — Pengeluaran Bulan Ini Section Redesign

**Intent**
Perbarui section "Pengeluaran Bulan Ini" agar sesuai mockup:
- Header: icon wallet + judul + "Lihat Detail" di kanan (teal)
- Setiap kategori: icon emoji/warna + nama + progress bar + nominal di kanan
- Progress bar lebih tebal (h-2) dan berwarna per kategori
- Tampilan lebih spacious

**Expected Outcomes**
- Progress bar lebih tebal dan terlihat jelas
- Nominal rata kanan
- Warna progress bar: teal (tagihan), biru (makanan), amber (kesehatan), rose (transportasi)

**Todo List**
- [ ] Update layout kategori budget di `dashboard/page.tsx` — pastikan icon warna dot + nama + bar + nominal sejajar
- [ ] Update progress bar dari `h-1.5` menjadi `h-2`
- [ ] Tambahkan icon dot berwarna yang lebih besar sebelum nama kategori

**Relevant Context**
- File: `frontend/app/(dashboard)/dashboard/page.tsx` lines 197–242

**Status**: [ ] pending

---

### Sub-Task 7 — Right Sidebar: Kalender & Reminder Vaksin Redesign

**Intent**
Perbarui tampilan kolom kanan (mini kalender + reminder vaksin) agar sesuai mockup:
- Kalender: header "Kalender" dengan navigasi bulan (panah kiri/kanan), grid hari lebih rapi
- Reminder Vaksin: icon shield ungu di header, badge status (Terlambat = merah, tanggal = biru)
- Kedua section di card putih rounded-xl dengan shadow

**Expected Outcomes**
- Mini kalender dengan header bulan yang jelas
- Vaccine reminder dengan icon dan badge warna yang sesuai mockup
- Separator antar item vaksin lebih clean

**Todo List**
- [ ] Update header MiniCalendar — tambahkan nama bulan + tahun di judul
- [ ] Update vaccine section header — tambahkan icon shield ungu
- [ ] Update badge vaksin: overdue = `bg-red-100 text-red-600`, scheduled = `bg-blue-100 text-blue-600`

**Relevant Context**
- File: `frontend/app/(dashboard)/dashboard/page.tsx` lines 246–290 (sections), 297–346 (MiniCalendar)

**Status**: [ ] pending

---

### Sub-Task 8 — Tips Hari Ini Section

**Intent**
Tambahkan section "Tips Hari Ini" di bagian bawah dashboard (sesuai mockup) — card dengan background kuning muda, icon bintang, teks tips statis.

**Expected Outcomes**
- Card kuning muda (`bg-amber-50`) dengan border amber tipis
- Icon bintang `✦` atau Sparkles di kiri
- Teks tips statis (hardcoded atau dari array tips rotasi harian)

**Todo List**
- [ ] Tambahkan komponen/section "Tips Hari Ini" di bagian bawah `dashboard/page.tsx`
- [ ] Gunakan array tips statis dan pilih berdasarkan `day of year % tips.length`
- [ ] Style: `bg-amber-50 border border-amber-100 rounded-xl p-4`

**Relevant Context**
- File: `frontend/app/(dashboard)/dashboard/page.tsx` — tambahkan setelah grid utama

**Status**: [ ] pending

---

### Sub-Task 9 — Auth Pages Redesign (Login & Register)

**Intent**
Ubah tampilan halaman Login dan Register dari dark-glassmorphism (background gelap `#1a2744` + form transparan) menjadi clean light design:
- Background: abu-abu muda `#F0F2F5` (konsisten dengan dashboard)
- Card form: putih solid dengan shadow, rounded-2xl
- Input fields: putih dengan border abu-abu tipis, focus ring teal
- Tombol submit: teal (primary), bukan oranye
- Branding logo + judul HABIT tetap ada di atas card

**Expected Outcomes**
- Auth layout background berubah dari gelap ke terang
- Login form berada dalam card putih yang clean (`bg-white shadow-md rounded-2xl`)
- Input fields tidak lagi transparan — solid putih dengan border normal
- Label teks gelap (bukan putih)
- Tombol "Masuk" / "Daftar" warna teal konsisten dengan warna primary app
- Tombol Google login menggunakan style white button dengan border abu-abu
- Error message styling disesuaikan (merah muda biasa, bukan glassmorphism)
- Register page sudah pakai Card component — perlu di-unskin (hapus override glassmorphism)

**Todo List**
- [ ] Update `frontend/app/(auth)/layout.tsx`:
  - Ubah `bg-[#1a2744]` → `bg-[#F0F2F5]`
  - Hapus dekoratif lingkaran glassmorphism
  - Tambahkan card wrapper putih di sekitar `{children}` dengan shadow + rounded-2xl
  - Ubah warna teks branding HABIT dari putih ke dark (`text-[#1a2744]`)
- [ ] Update `frontend/app/(auth)/login/page.tsx`:
  - Ubah semua styling input dari `bg-white/10 border-white/15 text-white` → `bg-white border-neutral-200 text-neutral-800`
  - Ubah label dari `text-white/70` → `text-neutral-600`
  - Ubah tombol submit dari `bg-[#f97316]` → gunakan default Button (teal primary)
  - Ubah error text dari `text-red-200` → `text-red-600`
  - Ubah "Belum punya akun?" text dari `text-white/40` → `text-neutral-500`
  - Ubah separator `atau` dari `border-white/15 text-white/30` → `border-neutral-200 text-neutral-400`
  - Ubah Google login button dari glassmorphism → `bg-white border-neutral-200 text-neutral-700`
- [ ] Update `frontend/app/(auth)/register/page.tsx`:
  - Hapus override glassmorphism di Card: `bg-white/10 backdrop-blur-md text-white [&_label]:...`
  - Gunakan Card default (putih, border normal)
  - Sesuaikan CardTitle, CardDescription, CardFooter dengan warna gelap normal

**Relevant Context**
- File: `frontend/app/(auth)/layout.tsx` — layout wrapper semua halaman auth
- File: `frontend/app/(auth)/login/page.tsx` — form login (saat ini dark glassmorphism)
- File: `frontend/app/(auth)/register/page.tsx` — form register (saat ini Card glassmorphism)

**Status**: [ ] pending

---

## Urutan Implementasi

```
Sub-Task 1 → Sub-Task 2 → Sub-Task 3 → Sub-Task 4 → Sub-Task 5 → Sub-Task 6 → Sub-Task 7 → Sub-Task 8 → Sub-Task 9
```

Setiap sub-task diimplementasikan satu per satu agar mudah di-review.
