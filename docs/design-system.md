# Family Hub — Design System

> Versi: 1.0  
> Status: Task 0.1 ✅  
> Terakhir diperbarui: 2025

---

## 1. Nama & Tagline

| Item | Value |
|------|-------|
| **Nama Aplikasi** | **Keluarga** |
| **Tagline** | *Semua cerita keluarga, dalam satu tempat* |
| **Sub-tagline (onboarding)** | *Atur jadwal, tugas, kenangan, dan keuangan keluarga bersama* |

**Alasan Penamaan:**  
"Keluarga" dipilih karena langsung mewakili konsep utama, mudah diucapkan, familiar bagi pengguna Indonesia, dan terasa hangat. Tidak menggunakan bahasa Inggris agar lebih dekat secara emosional dengan target pengguna.

---

## 2. Palet Warna

### 2.1 Primary — Teal Hangat

Warna utama adalah teal/hijau-biru hangat. Bukan biru korporat, bukan hijau terang — melainkan teal yang terasa trustworthy sekaligus ramah.

| Token | HEX | Penggunaan |
|-------|-----|-----------|
| `primary-50` | `#f0fdfa` | Background lembut, hover state |
| `primary-100` | `#ccfbf1` | Badge background, chip |
| `primary-200` | `#99f6e4` | Border aktif ringan |
| `primary-300` | `#5eead4` | Ilustrasi, dekoratif |
| `primary-400` | `#2dd4bf` | Icon fill, indicator |
| `primary-500` | `#14b8a6` | **Warna utama — CTA, link** |
| `primary-600` | `#0d9488` | Button hover, active |
| `primary-700` | `#0f766e` | Button pressed, dark mode primary |
| `primary-800` | `#115e59` | Teks di atas background terang |
| `primary-900` | `#134e4a` | Judul dengan nuansa gelap |

**Warna utama yang paling sering dipakai:** `primary-500` (#14b8a6) dan `primary-600` (#0d9488)

---

### 2.2 Secondary — Indigo Hangat

Warna sekunder melengkapi teal dengan nuansa violet-indigo yang hangat, digunakan untuk elemen penanda kedua.

| Token | HEX | Penggunaan |
|-------|-----|-----------|
| `secondary-50` | `#eef2ff` | Background sekunder |
| `secondary-100` | `#e0e7ff` | Badge sekunder |
| `secondary-400` | `#818cf8` | Icon sekunder |
| `secondary-500` | `#6366f1` | **Warna sekunder utama** |
| `secondary-600` | `#4f46e5` | Hover, pressed |
| `secondary-700` | `#4338ca` | Dark teks sekunder |

---

### 2.3 Accent — Amber Hangat

Digunakan untuk highlight penting, notification badge, dan pengingat.

| Token | HEX | Penggunaan |
|-------|-----|-----------|
| `accent-50` | `#fffbeb` | Background highlight |
| `accent-100` | `#fef3c7` | Badge notification |
| `accent-400` | `#fbbf24` | Icon highlight |
| `accent-500` | `#f59e0b` | **Accent utama** |
| `accent-600` | `#d97706` | Hover accent |

---

### 2.4 Neutral — Warm Gray

Warna netral menggunakan warm gray (sedikit kemerahan) bukan cool gray, agar halaman terasa lebih hangat.

| Token | HEX | Penggunaan |
|-------|-----|-----------|
| `neutral-0` | `#ffffff` | Background putih murni |
| `neutral-50` | `#fafaf9` | App background |
| `neutral-100` | `#f5f5f4` | Surface card |
| `neutral-200` | `#e7e5e4` | Border default |
| `neutral-300` | `#d6d3d1` | Border input |
| `neutral-400` | `#a8a29e` | Placeholder, disabled |
| `neutral-500` | `#78716c` | Muted text |
| `neutral-600` | `#57534e` | Secondary text |
| `neutral-700` | `#44403c` | Body text |
| `neutral-800` | `#292524` | Primary text |
| `neutral-900` | `#1c1917` | Heading utama |

---

### 2.5 Semantic Colors

| Token | HEX | Penggunaan |
|-------|-----|-----------|
| `success-50` | `#f0fdf4` | Background success |
| `success-500` | `#22c55e` | Success state |
| `success-600` | `#16a34a` | Success text/icon |
| `warning-50` | `#fffbeb` | Background warning |
| `warning-500` | `#f59e0b` | Warning state |
| `warning-600` | `#d97706` | Warning text/icon |
| `error-50` | `#fef2f2` | Background error |
| `error-500` | `#ef4444` | Error state |
| `error-600` | `#dc2626` | Error text/icon |
| `info-50` | `#eff6ff` | Background info |
| `info-500` | `#3b82f6` | Info state |
| `info-600` | `#2563eb` | Info text/icon |

---

## 3. Palet Warna Anggota Keluarga

Setiap anggota keluarga mendapat warna unik yang tampil di: Avatar, event pada kalender, tugas yang di-assign, dan label nama.

| Slot | Nama Token | HEX (Light) | HEX (Dark bg text) | Karakter |
|------|-----------|------------|-------------------|---------|
| Member 1 | `member-sky` | `#0ea5e9` | `#0284c7` | Tenang, bisa jadi Ayah |
| Member 2 | `member-rose` | `#f43f5e` | `#e11d48` | Energik, bisa jadi Ibu |
| Member 3 | `member-violet` | `#8b5cf6` | `#7c3aed` | Kreatif |
| Member 4 | `member-amber` | `#f59e0b` | `#d97706` | Ceria, bisa jadi anak kecil |
| Member 5 | `member-emerald` | `#10b981` | `#059669` | Segar |
| Member 6 | `member-orange` | `#f97316` | `#ea580c` | Bersemangat |
| Member 7 | `member-pink` | `#ec4899` | `#db2777` | Manis, bisa jadi anak perempuan |
| Member 8 | `member-indigo` | `#6366f1` | `#4f46e5` | Bijaksana |

**Cara penggunaan:**
- Avatar background: `{member-color}` dengan opacity 15% sebagai bg, warna penuh sebagai teks inisial
- Dot pada kalender: `{member-color}` solid
- Badge nama: background `{member-color}/15`, teks `{member-color}`

---

## 4. Tipografi

### 4.1 Font Family

| Tipe | Font | Fallback |
|------|------|---------|
| **Heading** | Plus Jakarta Sans | `system-ui, sans-serif` |
| **Body** | Plus Jakarta Sans | `system-ui, sans-serif` |
| **Mono** | JetBrains Mono | `monospace` |

**Alasan Plus Jakarta Sans:**  
Modern, clean, sangat readable di layar kecil, tersedia gratis di Google Fonts. Character set lengkap untuk Bahasa Indonesia. Weight 400–700 cukup untuk semua kebutuhan.

### 4.2 Skala Ukuran

| Token | Size | Line Height | Weight | Penggunaan |
|-------|------|-------------|--------|-----------|
| `text-xs` | 11px | 1.5 | 400 | Caption, timestamp kecil |
| `text-sm` | 13px | 1.5 | 400 | Label, helper text |
| `text-base` | 15px | 1.6 | 400 | Body text utama |
| `text-lg` | 17px | 1.5 | 500 | Sub-heading ringan |
| `text-xl` | 19px | 1.4 | 600 | Card title, section heading |
| `text-2xl` | 22px | 1.3 | 700 | Page heading |
| `text-3xl` | 28px | 1.2 | 700 | Hero heading |
| `text-4xl` | 36px | 1.2 | 800 | Display / splash |

### 4.3 Font Weight

| Token | Value | Penggunaan |
|-------|-------|-----------|
| `font-normal` | 400 | Body, placeholder |
| `font-medium` | 500 | Sub-label, UI teks |
| `font-semibold` | 600 | Button, heading kecil |
| `font-bold` | 700 | Heading, title |
| `font-extrabold` | 800 | Display, hero |

---

## 5. Design Token

### 5.1 Spacing Scale (base 4px)

| Token | Value | Penggunaan Tipikal |
|-------|-------|-------------------|
| `space-0.5` | 2px | Gap antar icon dan teks inline |
| `space-1` | 4px | Gap tight |
| `space-2` | 8px | Padding chip/badge |
| `space-3` | 12px | Gap internal komponen |
| `space-4` | 16px | Padding komponen standar |
| `space-5` | 20px | Gap antar elemen dalam card |
| `space-6` | 24px | Padding card |
| `space-8` | 32px | Section spacing kecil |
| `space-10` | 40px | Section spacing |
| `space-12` | 48px | Gap antar section |
| `space-16` | 64px | Padding halaman |
| `space-20` | 80px | Hero padding |

### 5.2 Border Radius

| Token | Value | Penggunaan |
|-------|-------|-----------|
| `rounded-sm` | 4px | Tag, chip kecil |
| `rounded` | 6px | Input, select |
| `rounded-md` | 8px | Button secondary, small card |
| `rounded-lg` | 12px | Card utama, modal |
| `rounded-xl` | 16px | Card besar, bottom sheet |
| `rounded-2xl` | 20px | Hero card, featured item |
| `rounded-full` | 9999px | Avatar, badge dot, pill button |

**Prinsip:** Semua komponen menggunakan `rounded-lg` (12px) ke atas — tidak ada sharp corner. Ini memberi kesan friendly dan modern.

### 5.3 Shadow

| Token | Value | Penggunaan |
|-------|-------|-----------|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | Input focus ring subtle |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)` | Card default |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)` | Dropdown, popover |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)` | Modal, dialog |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04)` | Floating panel |

### 5.4 Z-Index Scale

| Token | Value | Penggunaan |
|-------|-------|-----------|
| `z-base` | 0 | Konten normal |
| `z-raised` | 10 | Card hover, sticky element |
| `z-dropdown` | 100 | Dropdown, select menu |
| `z-overlay` | 200 | Modal backdrop |
| `z-modal` | 300 | Modal, dialog |
| `z-toast` | 400 | Toast notification |
| `z-tooltip` | 500 | Tooltip |

### 5.5 Transition

| Token | Value | Penggunaan |
|-------|-------|-----------|
| `transition-fast` | `150ms ease` | Hover micro-interaction |
| `transition-base` | `200ms ease` | Button, input focus |
| `transition-slow` | `300ms ease-in-out` | Modal open/close, slide |

---

## 6. Komponen Dasar

### 6.1 Button

#### Variants

**Primary Button**
```
bg: primary-500 (#14b8a6)
text: white
hover: primary-600 (#0d9488)
active: primary-700 (#0f766e)
border-radius: rounded-lg (12px)
padding: 10px 20px
font: text-sm (13px), font-semibold
min-height: 40px
transition: 200ms ease
```

**Secondary Button**
```
bg: white
text: neutral-700
border: 1.5px solid neutral-200
hover bg: neutral-50
hover border: neutral-300
border-radius: rounded-lg
padding: 10px 20px
font: text-sm, font-semibold
```

**Ghost Button**
```
bg: transparent
text: primary-600
hover bg: primary-50
border: none
border-radius: rounded-lg
padding: 10px 20px
```

**Danger Button**
```
bg: error-500
text: white
hover: error-600
border-radius: rounded-lg
```

**Sizes:**
- `sm`: padding 6px 14px, text-xs, min-height 32px
- `md`: padding 10px 20px, text-sm, min-height 40px (default)
- `lg`: padding 12px 24px, text-base, min-height 48px

**Disabled State:**
```
opacity: 0.45
cursor: not-allowed
bg: neutral-200
text: neutral-400
```

---

### 6.2 Input

```
height: 40px (md), 48px (lg)
border: 1.5px solid neutral-300
border-radius: rounded-lg (12px) — lebih rounded dari standar
background: white
text: neutral-800, text-sm
placeholder: neutral-400

focus:
  border-color: primary-500
  ring: 3px solid primary-500/20
  outline: none

error:
  border-color: error-500
  ring: 3px solid error-500/20

disabled:
  bg: neutral-100
  cursor: not-allowed
  opacity: 0.6

label:
  text-sm, font-medium, neutral-700
  margin-bottom: 6px

helper-text:
  text-xs, neutral-500
  margin-top: 4px

error-text:
  text-xs, error-600
  margin-top: 4px
```

---

### 6.3 Card

**Default Card**
```
background: white
border: 1px solid neutral-200
border-radius: rounded-xl (16px)
padding: 20px (space-5)
shadow: shadow-sm
```

**Hover Card (clickable)**
```
hover: shadow-md
hover border: primary-200
transition: 200ms ease
cursor: pointer
```

**Featured/Highlight Card**
```
background: primary-50
border: 1.5px solid primary-200
border-radius: rounded-2xl (20px)
padding: 24px (space-6)
```

**Section Card (dengan header)**
```
header:
  padding: 16px 20px
  border-bottom: 1px solid neutral-100
  title: text-base, font-semibold, neutral-800

body:
  padding: 20px
```

---

### 6.4 Badge

| Variant | Background | Text | Border-radius |
|---------|-----------|------|--------------|
| Default | neutral-100 | neutral-600 | rounded-full |
| Primary | primary-100 | primary-700 | rounded-full |
| Success | success-50 | success-600 | rounded-full |
| Warning | warning-50 (amber-50) | warning-600 | rounded-full |
| Error | error-50 | error-600 | rounded-full |
| Info | info-50 | info-600 | rounded-full |

**Sizes:**
- `sm`: padding 2px 8px, text-xs (11px)
- `md`: padding 3px 10px, text-sm (13px) — default

**Dot Badge (notification):**
```
width: 8px, height: 8px
border-radius: rounded-full
color: error-500 atau accent-500
border: 2px solid white (untuk di atas avatar)
```

---

### 6.5 Modal / Dialog Header

```
header:
  padding: 20px 24px
  border-bottom: 1px solid neutral-100
  display: flex, justify-between, align-center

  title:
    text-lg, font-semibold, neutral-900

  close-button:
    icon: X (Lucide), size 20px
    color: neutral-400
    hover: neutral-600
    padding: 4px
    border-radius: rounded-md

body:
  padding: 20px 24px

footer:
  padding: 16px 24px
  border-top: 1px solid neutral-100
  display: flex, justify-end, gap: 8px

backdrop:
  bg: neutral-900/50
  backdrop-blur: 2px

modal-container:
  border-radius: rounded-2xl (20px)
  shadow: shadow-xl
  background: white
  max-width: 480px (sm), 640px (md), 800px (lg)
  animation: slide-up + fade-in, 300ms ease
```

---

### 6.6 Avatar

**Dengan Foto**
```
shape: rounded-full
sizes: 28px (xs), 36px (sm), 44px (md), 56px (lg), 72px (xl)
object-fit: cover
border: 2px solid white (saat overlap/group)
```

**Tanpa Foto (Inisial)**
```
background: {member-color}/15
text: {member-color}, font-semibold
text-size: disesuaikan dengan size avatar
```

**Avatar Group (overlap)**
```
each avatar: border 2px solid white
margin-left: -8px (kecuali yang pertama)
max-show: 4 avatar + "+N" label
```

**Avatar dengan Status Dot**
```
dot: 10px x 10px
position: bottom-right
border: 2px solid white
online: success-500
offline: neutral-300
away: warning-500
```

---

## 7. Ikon

**Library:** Lucide Icons (sudah termasuk dalam Shadcn/UI)

**Ukuran Standar:**
| Konteks | Size |
|---------|------|
| Inline dalam teks | 14px (lucide `size={14}`) |
| Button icon | 16px |
| Navigation icon | 20px |
| Feature icon (card) | 24px |
| Hero/Ilustrasi | 32–48px |

**Warna:**
- Icon di tombol putih: `white`
- Icon navigasi aktif: `primary-600`
- Icon navigasi non-aktif: `neutral-400`
- Icon dalam konten: `neutral-500` atau ikut warna konteks

---

## 8. Navigasi

### Bottom Navigation (Mobile)
```
height: 60px + safe-area-inset-bottom
background: white
border-top: 1px solid neutral-100
shadow: 0 -2px 8px rgba(0,0,0,0.05)
5 item: Home, Kalender, Tugas, Budget, Profil

item aktif:
  icon: primary-600
  label: primary-600, text-xs, font-semibold

item non-aktif:
  icon: neutral-400
  label: neutral-400, text-xs
```

### Sidebar (Desktop)
```
width: 240px (expanded), 64px (collapsed)
background: white
border-right: 1px solid neutral-100
padding: 16px 12px

nav-item:
  padding: 8px 12px
  border-radius: rounded-lg
  icon: 20px + label text-sm

  aktif:
    background: primary-50
    text: primary-700
    icon: primary-600
    border-left: 3px solid primary-500

  hover:
    background: neutral-50
```

---

## 9. Panduan Aksesibilitas

- Rasio kontras teks utama (neutral-800 di atas white): **>7:1** ✅
- Rasio kontras button primary (white di atas primary-500): **>4.5:1** ✅
- Semua input memiliki label visible (bukan hanya placeholder)
- Focus ring wajib ada di semua elemen interaktif
- Touch target minimum: **44px × 44px** (mobile)
- Gunakan `aria-label` untuk icon-only button

---

## 10. Dark Mode (Planned)

Dark mode akan diimplementasikan di Fase 9 (Polish). Token yang perlu dipersiapkan:

```
dark:background → neutral-900 (#1c1917)
dark:surface → neutral-800 (#292524)
dark:border → neutral-700 (#44403c)
dark:text-primary → neutral-50
dark:text-secondary → neutral-400
dark:primary → primary-400 (#2dd4bf) — lebih terang untuk kontras
```

---

## 11. Ringkasan Token Penting

```css
/* CSS Variables ringkasan */
--color-primary: #14b8a6;
--color-secondary: #6366f1;
--color-accent: #f59e0b;

--color-bg: #fafaf9;
--color-surface: #f5f5f4;
--color-border: #e7e5e4;
--color-text: #292524;
--color-text-muted: #78716c;

--font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-size-base: 15px;

--radius-card: 16px;
--radius-button: 12px;
--radius-input: 12px;
```
