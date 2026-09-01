# Family Hub — Komponen Kunci (Hi-Fi)

> Versi: 1.0  
> Status: Task 0.3 ✅  
> Terakhir diperbarui: 2025  
> Referensi: `docs/design-system.md`

---

## Panduan Umum

Semua komponen dibangun di atas **Shadcn/UI + Tailwind CSS**. Setiap komponen harus memiliki state yang terdefinisi lengkap:

| State | Deskripsi |
|-------|-----------|
| `default` | Tampilan normal |
| `hover` | Kursor di atas elemen |
| `active/pressed` | Sedang diklik/ditekan |
| `focus` | Elemen mendapat fokus keyboard |
| `loading` | Data sedang dimuat |
| `empty` | Tidak ada data untuk ditampilkan |
| `error` | Terjadi kesalahan |
| `disabled` | Elemen tidak dapat diinteraksikan |

---

## 1. Navigasi

### 1.1 Sidebar (Desktop)

**Struktur:**
```
<Sidebar>
  <SidebarHeader>          ← Logo + nama app "Keluarga"
  <SidebarNav>             ← Daftar menu navigasi
    <NavItem active />     ← Item aktif
    <NavItem />            ← Item non-aktif
  </SidebarNav>
  <SidebarFooter>          ← Avatar user + nama + tombol Settings
</Sidebar>
```

**Spesifikasi:**
```
width (expanded): 240px
width (collapsed): 64px
background: white
border-right: 1px solid neutral-200
padding: 16px 12px
transition: width 200ms ease
```

**NavItem States:**
```
default:
  padding: 8px 12px
  border-radius: rounded-lg
  icon: neutral-400 (20px)
  text: neutral-600, text-sm, font-medium
  gap antara icon & teks: 10px

hover:
  background: neutral-50
  icon: neutral-600
  text: neutral-800

active:
  background: primary-50
  icon: primary-600
  text: primary-700, font-semibold
  border-left: 3px solid primary-500
```

**SidebarHeader:**
```
height: 56px
padding: 0 12px
display: flex, align-center, gap: 10px
logo: 32px × 32px, rounded-lg, primary-500 bg
app-name: text-base, font-bold, neutral-900
tagline (saat expanded): text-xs, neutral-400
```

**SidebarFooter:**
```
padding: 12px
border-top: 1px solid neutral-100
user-info: Avatar(36px) + nama + role
settings-button: icon Ghost button (icon: Settings, 16px)
```

**Collapsed State:**
```
hanya tampilkan icon (tooltip saat hover)
SidebarHeader: hanya logo
SidebarFooter: hanya avatar
toggle button: ChevronLeft / ChevronRight
```

---

### 1.2 Bottom Navigation (Mobile)

**Struktur:**
```
<BottomNav>
  <NavItem icon="Home" label="Home" />
  <NavItem icon="Calendar" label="Kalender" />
  <NavItem icon="CheckSquare" label="Tugas" />
  <NavItem icon="Wallet" label="Budget" />
  <NavItem icon="User" label="Profil" />
</BottomNav>
```

**Spesifikasi:**
```
height: 60px + safe-area-inset-bottom (env(safe-area-inset-bottom))
background: white
border-top: 1px solid neutral-100
shadow: 0 -2px 8px rgba(0,0,0,0.05)
position: fixed, bottom: 0, z-index: z-raised
```

**NavItem States:**
```
default (non-aktif):
  icon: neutral-400 (22px)
  label: neutral-400, text-xs

active:
  icon: primary-600 (22px)
  label: primary-600, text-xs, font-semibold
  indicator: 4px dot (rounded-full, primary-500) di atas icon

pressed:
  scale: 0.9, transition: 100ms
```

**Notification Badge:**
```
posisi: top-right dari icon
size: 8px dot (tanpa angka) atau 16px pill (dengan angka)
color: error-500
border: 2px solid white
```

---

## 2. Kalender

### 2.1 EventCard

Komponen card yang merepresentasikan satu event di kalender.

**Spesifikasi:**
```
Ukuran (inline di grid):
  height: sesuai durasi (min 24px per 30 menit)
  width: 100% atau dibagi jika overlap

Padding: 4px 8px
Border-radius: rounded-md (8px)
Font: text-xs, font-medium
Overflow: hidden, text truncate

Warna:
  background: {member-color}/15
  border-left: 3px solid {member-color}
  text: {member-color} (dark variant)
```

**States:**
```
default:
  opacity: 1

hover:
  background: {member-color}/25
  shadow: shadow-sm
  cursor: pointer

active/pressed:
  background: {member-color}/35
  scale: 0.98

selected:
  border: 2px solid {member-color}
  shadow: shadow-md
```

**Struktur:**
```
<EventCard>
  <EventTime>  ← "09:00 – 10:00" (text-xs)
  <EventTitle> ← Nama event (font-medium, truncate)
  <AvatarGroup size="xs" max={3} />  ← Peserta
</EventCard>
```

**Empty State (hari tanpa event):**
```
Tidak ada visual khusus — hanya kosong (bukan placeholder)
```

---

### 2.2 CalendarMemberBadge

Badge warna anggota keluarga untuk filter kalender.

**Spesifikasi:**
```
background: {member-color}/15
text: {member-color}
border-radius: rounded-full
padding: 4px 10px
display: Avatar(20px) + nama
font: text-xs, font-medium

active (filter ON):
  background: {member-color}
  text: white

hover:
  background: {member-color}/25
```

---

## 3. Task Card

Komponen card untuk satu tugas dalam Chore & Task Manager.

**Spesifikasi:**
```
background: white
border: 1px solid neutral-200
border-radius: rounded-xl (16px)
padding: 14px 16px
shadow: shadow-sm
```

**Struktur:**
```
<TaskCard>
  <TaskHeader>
    <Checkbox />              ← Centang selesai
    <TaskTitle />             ← Nama tugas (text-sm, font-semibold)
    <PriorityBadge />         ← High/Med/Low
  </TaskHeader>
  <TaskMeta>
    <DueDateBadge />          ← Tanggal jatuh tempo
    <CategoryBadge />         ← Kategori (kebersihan, masak, dll)
    <PointsBadge />           ← Poin reward
  </TaskMeta>
  <TaskFooter>
    <AvatarGroup size="sm" /> ← Assigned member
    <ProgressDot />           ← Status dot
  </TaskFooter>
</TaskCard>
```

**States:**
```
default:
  opacity: 1, border: neutral-200

hover:
  border: primary-200
  shadow: shadow-md
  cursor: pointer

completed:
  title: line-through, neutral-400
  background: neutral-50
  opacity: 0.7
  checkbox: checked (primary-500 fill)

overdue:
  border-left: 3px solid error-500
  DueDateBadge: error variant

loading:
  Skeleton placeholder (3 baris: title, meta, footer)

empty state (daftar tugas kosong):
  Ilustrasi bersih + teks "Belum ada tugas. Tambah yuk!" + Button Primary
```

**PriorityBadge:**
```
High:   bg error-50,   text error-600,   icon: AlertCircle
Medium: bg warning-50, text warning-600, icon: Minus
Low:    bg neutral-100, text neutral-500, icon: ArrowDown
```

**PointsBadge:**
```
background: accent-50
text: accent-600
icon: Star (14px)
format: "+10 poin"
```

---

## 4. Expense Card & Budget Summary

### 4.1 ExpenseCard

Satu item transaksi pengeluaran.

**Spesifikasi:**
```
background: white
border: 1px solid neutral-100
border-radius: rounded-xl
padding: 12px 16px
display: flex, align-center, gap: 12px
```

**Struktur:**
```
<ExpenseCard>
  <CategoryIcon>     ← Ikon kategori dalam lingkaran berwarna
  <ExpenseInfo>
    <Title />        ← Nama pengeluaran (text-sm, font-medium)
    <SubInfo />      ← Kategori + tanggal (text-xs, neutral-500)
  </ExpenseInfo>
  <ExpenseAmount />  ← Nominal (text-sm, font-bold, error-600 untuk debit)
  <MemberAvatar />   ← Siapa yang mencatat (size xs)
</ExpenseCard>
```

**States:**
```
debit (pengeluaran):
  amount: text-sm, font-bold, error-600 → "-Rp 50.000"

credit (pemasukan):
  amount: text-sm, font-bold, success-600 → "+Rp 1.500.000"

hover:
  background: neutral-50
  cursor: pointer

loading skeleton:
  icon circle + 2 baris teks + 1 angka
```

**CategoryIcon:**
```
size: 40px × 40px, rounded-full
background: {category-color}/15
icon: Lucide (20px, {category-color})

Mapping kategori → warna:
  Makanan: amber-500
  Transport: sky-500
  Belanja: violet-500
  Kesehatan: green-500
  Hiburan: pink-500
  Tagihan: orange-500
  Lainnya: neutral-500
```

---

### 4.2 BudgetProgressCard

Card ringkasan budget per kategori.

**Spesifikasi:**
```
background: white
border: 1px solid neutral-200
border-radius: rounded-xl
padding: 16px 20px
```

**Struktur:**
```
<BudgetProgressCard>
  <CardHeader>
    <CategoryIcon />
    <CategoryName />   ← text-sm, font-semibold
    <BudgetBadge />    ← "dari Rp 2.000.000"
  </CardHeader>
  <ProgressBar>
    <Track />          ← bg neutral-100, rounded-full, height 8px
    <Fill />           ← bg sesuai status, rounded-full
  </ProgressBar>
  <CardFooter>
    <SpentAmount />    ← "Rp 1.200.000 terpakai"
    <Percentage />     ← "60%"
  </CardFooter>
</BudgetProgressCard>
```

**ProgressBar States:**
```
normal (<70%):   fill: primary-500
warning (70-90%): fill: warning-500
danger (>90%):   fill: error-500

overflow (>100%): fill: error-500, animasi pulse
```

---

### 4.3 BudgetSummaryChart

Grafik ringkasan budget (donut/pie + legend).

**Spesifikasi:**
```
Chart type: Donut chart (Recharts atau Tremor)
Size: 200px × 200px (mobile), 240px × 240px (desktop)

Legend:
  display: flex, flex-col, gap: 8px
  item: ColorDot(10px) + CategoryName + Amount + Percentage

Center label (donut):
  Total pengeluaran (font-bold, text-xl)
  sub: "dari Rp X budget"
```

**Empty State:**
```
Donut chart ditampilkan abu-abu (neutral-200)
Teks: "Belum ada transaksi bulan ini"
```

---

## 5. Memory Card

Komponen card untuk foto/kenangan.

**Spesifikasi:**
```
border-radius: rounded-2xl (20px)
overflow: hidden
aspect-ratio: 4/3 (horizontal) atau 3/4 (vertikal) atau 1/1 (square)
shadow: shadow-sm
```

**Struktur:**
```
<MemoryCard>
  <Thumbnail>           ← Foto (object-fit: cover, 100% width/height)
    <MemberBadges />    ← Avatar group di sudut kiri atas
    <DateBadge />       ← Tanggal di sudut kanan atas
  </Thumbnail>
  <CardInfo>
    <Title />           ← Caption (text-sm, font-medium, truncate)
    <TagList />         ← Tag (badge sm, neutral)
  </CardInfo>
</MemoryCard>
```

**States:**
```
default:
  overlay: none

hover:
  overlay: gradient hitam dari bawah (0% → 40% opacity)
  teks muncul dari bawah (translate-y: 0, opacity: 1)
  cursor: pointer
  scale: 1.02, transition: 200ms

loading skeleton:
  thumbnail: rounded-2xl, bg neutral-200 (shimmer)
  title: 1 baris teks skeleton

empty state (album kosong):
  Ilustrasi kamera + "Belum ada kenangan. Yuk tambahkan foto!" + Button
```

**Overlay hover teks:**
```
position: absolute, bottom: 0, left: 0, right: 0
padding: 12px 14px
background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)
title: text-sm, font-semibold, white
date: text-xs, white/70
```

---

## 6. Kids Growth Chart

Grafik pertumbuhan anak dengan kurva referensi WHO.

**Spesifikasi:**
```
Chart type: Line chart (Recharts)
Width: 100%
Height: 280px (mobile), 320px (desktop)
```

**Data Series:**
```
Garis anak:
  color: member-color anak
  strokeWidth: 2.5
  dot: radius 4, filled

Kurva WHO (referensi):
  P3:  color: neutral-300, strokeDasharray: 4 2, strokeWidth: 1
  P50: color: neutral-400, strokeDasharray: 4 2, strokeWidth: 1.5
  P97: color: neutral-300, strokeDasharray: 4 2, strokeWidth: 1
```

**Legend:**
```
Garis anak: nama anak + warna
Kurva WHO: "Referensi WHO P3/P50/P97"
```

**Tooltip (saat hover titik data):**
```
background: white
border: 1px solid neutral-200
border-radius: rounded-lg
shadow: shadow-md
padding: 10px 14px
konten: Tanggal, BB/TB, Persentil estimasi
```

**States:**
```
loading:
  Skeleton chart (garis-garis abu-abu kosong)

empty state (belum ada data ukur):
  Grafik kosong dengan teks "Belum ada data pertumbuhan"
  Button: "+ Tambah Pengukuran"

tooltip hover:
  dot mengembang (radius 6), garis vertikal dashed
```

---

## 7. Halaman Login & Register

### 7.1 Login Page

**Layout:**
```
Mobile: single-column, center-aligned
Desktop: split-layout (kiri: hero ilustrasi, kanan: form)

Lebar form: max-width 400px
Padding: 32px (mobile), 48px (desktop)
```

**Struktur:**
```
<LoginPage>
  <LogoBlock>
    <Logo />         ← 48px logo + nama "Keluarga"
    <Tagline />      ← "Semua cerita keluarga, dalam satu tempat"
  </LogoBlock>
  <FormBlock>
    <Heading>        ← "Selamat datang kembali"
    <SubText>        ← "Masuk ke akun Anda"
    <GoogleOAuthButton />
    <Divider>        ← "atau masuk dengan email"
    <EmailInput />
    <PasswordInput>  ← dengan toggle show/hide
    <ForgotPassword> ← link kanan
    <LoginButton />  ← Primary, full-width
    <RegisterLink>   ← "Belum punya akun? Daftar"
  </FormBlock>
</LoginPage>
```

**GoogleOAuthButton:**
```
background: white
border: 1.5px solid neutral-300
border-radius: rounded-lg
padding: 10px 20px
display: flex, center, gap: 10px
icon: Google SVG (18px)
text: "Lanjutkan dengan Google", text-sm, font-medium, neutral-700

hover:
  background: neutral-50
  border: neutral-400

loading (setelah klik):
  icon: spinner, teks: "Menghubungkan..."
  disabled: true
```

**Divider:**
```
display: flex, align-center, gap: 12px
line: flex-1, height: 1px, bg neutral-200
text: "atau", text-xs, neutral-400
```

**States Form:**
```
default: semua input kosong, button enabled
typing: live validation on blur
error: input border error-500, helper text merah, shake animation
loading (submit): button loading state, semua input disabled
success: redirect ke dashboard (tidak ada state di halaman ini)
```

---

### 7.2 Register Page

Sama dengan Login dengan perbedaan:
```
Heading: "Buat akun baru"
Fields tambahan: Nama Lengkap
Password Confirm: field kedua
TOS Checkbox: "Saya setuju dengan Syarat & Ketentuan"
Button: "Buat Akun"
Link bawah: "Sudah punya akun? Masuk"
```

---

## 8. Home Dashboard

**Layout:**
```
Mobile: single column scroll
Desktop: grid 12 kolom (bisa 2-3 kolom)
```

**Struktur Widget Grid:**
```
<DashboardPage>
  <DashboardHeader>
    <Greeting />         ← "Halo, [Nama]! 👋"
    <DateToday />        ← Tanggal hari ini
    <NotifButton />      ← icon Bell dengan badge
  </DashboardHeader>

  <WidgetGrid>
    <FamilyActivityWidget />   ← Aktivitas terbaru keluarga
    <UpcomingEventsWidget />   ← 3 event kalender terdekat
    <TaskSummaryWidget />      ← Tugas hari ini + progress
    <BudgetSnapshotWidget />   ← Ringkasan budget bulan ini
    <MemoryWidget />           ← Foto kenangan terbaru
    <ChoreLeaderboardWidget /> ← Poin tugas anggota keluarga
  </WidgetGrid>
</DashboardPage>
```

**Widget Spesifikasi Umum:**
```
background: white
border: 1px solid neutral-200
border-radius: rounded-2xl
padding: 16px 20px
shadow: shadow-sm

header:
  title: text-sm, font-semibold, neutral-700
  action link: "Lihat semua", text-xs, primary-600

loading: Skeleton dengan shimmer (3 baris placeholder)
empty: ikon + teks pendek + CTA kecil
```

**FamilyActivityWidget:**
```
Height: auto
Content: List aktivitas terbaru (max 5)
  item: Avatar(28px) + "{Nama} [aksi]" + timestamp
  aksi contoh: "menyelesaikan tugas 'Cuci piring'"
  timestamp: "5 menit lalu", text-xs, neutral-400
```

**UpcomingEventsWidget:**
```
Content: List 3 event terdekat
  item: ColorDot({member-color}) + EventName + DateBadge
```

**TaskSummaryWidget:**
```
Content:
  Progress ring / bar: X/Y tugas selesai hari ini
  List 3 tugas pertama dengan checkbox
  "Lihat semua tugas" link
```

**BudgetSnapshotWidget:**
```
Content:
  Total pengeluaran bulan ini vs budget
  Mini donut chart atau progress bar
  "Lihat detail" link
```

**ChoreLeaderboardWidget:**
```
Content: Top 3 anggota dengan poin terbanyak bulan ini
  item: Rank badge + Avatar + Nama + Poin
  Rank 1: accent-500 (emas), Rank 2: neutral-400 (perak), Rank 3: amber-700 (perunggu)
```

---

## 9. Komponen Reusable Antar Modul

### 9.1 AvatarGroup

```
Tampilkan sampai N avatar yang overlap.
Jika lebih dari N: tampilkan "+X" avatar sisa.

Props:
  members: Member[]
  max: number (default 3)
  size: "xs" | "sm" | "md"

Ukuran:
  xs: 24px
  sm: 32px
  md: 40px

Overlap: margin-left: -8px (xs), -10px (sm), -12px (md)
"+X" pill:
  bg: neutral-200
  text: neutral-500, font-medium
  same size sebagai avatar
```

---

### 9.2 DatePicker

```
Base: Shadcn Calendar + Popover
Trigger: Input dengan icon Calendar di kanan
Format display: "Senin, 12 Januari 2025"
Format pendek: "12 Jan 2025"

States:
  default: border neutral-300
  open: border primary-500, ring primary-500/20
  selected: cell bg primary-500, text white, rounded-full
  today: border 1px solid primary-300
  disabled dates: opacity 0.4, cursor not-allowed
  range selection: first/last cell rounded-full, tengah bg primary-100
```

---

### 9.3 FileUploader

```
Tampilan default (idle):
  border: 2px dashed neutral-300
  border-radius: rounded-xl
  padding: 32px 24px
  center: ikon UploadCloud (32px, neutral-400) + teks "Seret file ke sini atau klik untuk pilih"
  sub: "JPG, PNG, PDF hingga 10MB"

hover / dragover:
  border: primary-400, dashed
  background: primary-50

uploading:
  Progress bar di bawah ikon
  Persentase upload
  Tombol "Batal"

success (file terpilih):
  Thumbnail (jika gambar) atau ikon file + nama file
  Tombol "Hapus" (X kecil)

error:
  border: error-500
  teks error: "File terlalu besar" / "Format tidak didukung"
```

---

### 9.4 EmptyState

Komponen standar untuk semua halaman/list yang kosong.

```
Struktur:
  <EmptyState>
    <Icon />      ← Lucide icon, 48px, neutral-300
    <Title />     ← text-base, font-semibold, neutral-600
    <Desc />      ← text-sm, neutral-400 (opsional)
    <CTAButton /> ← Primary button (opsional)
  </EmptyState>

Layout:
  display: flex, flex-col, align-center, gap: 12px
  padding: 40px 24px
  text-align: center
```

---

### 9.5 LoadingSkeleton

```
Setiap skeleton menggunakan animasi shimmer:
  background: linear-gradient(90deg, neutral-100 25%, neutral-200 50%, neutral-100 75%)
  background-size: 200% 100%
  animation: shimmer 1.5s infinite

Variasi:
  SkeletonText: height 14px, border-radius rounded-sm, berbagai lebar
  SkeletonAvatar: circle, ukuran sesuai avatar
  SkeletonCard: full card dengan beberapa baris SkeletonText
  SkeletonChart: rectangle tinggi, rounded-lg
```

---

## 10. Ringkasan Inventaris Komponen

| Komponen | File Target | Kompleksitas |
|----------|-------------|--------------|
| `Sidebar` | `components/layout/Sidebar.tsx` | Tinggi |
| `BottomNav` | `components/layout/BottomNav.tsx` | Sedang |
| `EventCard` | `components/calendar/EventCard.tsx` | Sedang |
| `CalendarMemberBadge` | `components/calendar/MemberBadge.tsx` | Rendah |
| `TaskCard` | `components/tasks/TaskCard.tsx` | Sedang |
| `ExpenseCard` | `components/budget/ExpenseCard.tsx` | Sedang |
| `BudgetProgressCard` | `components/budget/BudgetProgressCard.tsx` | Sedang |
| `BudgetSummaryChart` | `components/budget/SummaryChart.tsx` | Tinggi |
| `MemoryCard` | `components/memories/MemoryCard.tsx` | Sedang |
| `KidsGrowthChart` | `components/kids/GrowthChart.tsx` | Tinggi |
| `LoginPage` | `app/(auth)/login/page.tsx` | Tinggi |
| `RegisterPage` | `app/(auth)/register/page.tsx` | Tinggi |
| `DashboardWidgets` | `components/dashboard/*.tsx` | Tinggi |
| `AvatarGroup` | `components/ui/AvatarGroup.tsx` | Rendah |
| `DatePicker` | `components/ui/DatePicker.tsx` | Sedang |
| `FileUploader` | `components/ui/FileUploader.tsx` | Tinggi |
| `EmptyState` | `components/ui/EmptyState.tsx` | Rendah |
| `LoadingSkeleton` | `components/ui/Skeleton.tsx` | Rendah |
