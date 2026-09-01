# Family Hub — Frontend Plan

> Versi: 1.0  
> Status: Task 0.4 ✅  
> Terakhir diperbarui: 2025  
> Referensi: `docs/design-system.md`, `docs/components.md`, `family-hub-plan.md`

---

## 1. Prinsip Arsitektur Frontend

```
Framework : Next.js 14 (App Router)
Styling   : Tailwind CSS + Shadcn/UI
State     : Zustand (global) + TanStack Query (server state)
Form      : React Hook Form + Zod
HTTP      : Axios (instance terpisah per modul, base-url dari env)
Auth      : NextAuth.js (Google OAuth + credentials)
```

**Aturan Dasar:**
- Semua halaman menggunakan `app/` directory (App Router)
- Komponen Server vs Client dipisah secara tegas: halaman = Server Component, interaksi = Client Component
- Satu file = satu komponen (kecuali komponen micro yang sangat kecil)
- Hook data fetching dibuat terpisah di `hooks/` — tidak di dalam komponen langsung

---

## 2. State Management: Zustand vs TanStack Query

### 2.1 Apa yang masuk Zustand (Global UI State)

Zustand digunakan untuk state yang **bukan data server** — state UI yang perlu di-share antar komponen jauh.

| Store | State yang Disimpan |
|-------|---------------------|
| `useAuthStore` | User session aktif, family info, role |
| `useSidebarStore` | sidebar expanded/collapsed |
| `useCalendarStore` | current view (month/week/day), selected date |
| `useTaskFilterStore` | filter aktif (status, member, category) |
| `useBudgetStore` | bulan aktif yang sedang dilihat |
| `useThemeStore` | theme mode (light/dark) — Fase 9 |

**Aturan Zustand:**
- Tidak menyimpan data dari API (itu tugas React Query)
- Hanya state yang benar-benar perlu diakses dari banyak tempat
- Tiap store di file terpisah: `store/authStore.ts`, `store/sidebarStore.ts`, dll

---

### 2.2 Apa yang masuk TanStack Query (Server State)

TanStack Query menangani semua data yang berasal dari API backend.

| Query Key | Data | Hook |
|-----------|------|------|
| `['family', familyId]` | Data keluarga | `useFamilyQuery` |
| `['members', familyId]` | Daftar anggota | `useMembersQuery` |
| `['events', familyId, month]` | Event kalender | `useEventsQuery` |
| `['event', eventId]` | Detail event | `useEventQuery` |
| `['tasks', familyId, filters]` | Daftar tugas | `useTasksQuery` |
| `['task', taskId]` | Detail tugas | `useTaskQuery` |
| `['expenses', familyId, month]` | Pengeluaran bulan ini | `useExpensesQuery` |
| `['budgets', familyId, month]` | Budget per kategori | `useBudgetsQuery` |
| `['memories', familyId, page]` | Daftar kenangan | `useMemoriesQuery` |
| `['kids', familyId]` | Daftar anak | `useKidsQuery` |
| `['kid-growth', kidId]` | Data pertumbuhan anak | `useKidGrowthQuery` |
| `['documents', familyId]` | Dokumen keluarga | `useDocumentsQuery` |
| `['dashboard', familyId]` | Data agregat dashboard | `useDashboardQuery` |

**Konfigurasi QueryClient:**
```ts
staleTime: 5 * 60 * 1000      // 5 menit
gcTime: 10 * 60 * 1000        // 10 menit
retry: 1
refetchOnWindowFocus: false    // agar tidak terlalu sering refetch
```

---

## 3. Mapping API Endpoint → React Query Hook

### 3.1 Auth & Family (Modul 1)

| Endpoint | Method | Hook / Mutation | Keterangan |
|----------|--------|-----------------|------------|
| `POST /auth/register` | POST | `useRegisterMutation` | Daftar akun baru |
| `POST /auth/login` | POST | `useLoginMutation` | Login email |
| `GET /auth/google` | GET | Redirect NextAuth | Google OAuth |
| `POST /auth/logout` | POST | `useLogoutMutation` | Logout |
| `GET /families/:id` | GET | `useFamilyQuery` | Data keluarga |
| `POST /families` | POST | `useCreateFamilyMutation` | Buat keluarga baru |
| `POST /families/join` | POST | `useJoinFamilyMutation` | Join via kode invite |
| `GET /families/:id/members` | GET | `useMembersQuery` | Daftar anggota |
| `PUT /families/:id/members/:uid` | PUT | `useUpdateMemberMutation` | Update role/warna member |
| `DELETE /families/:id/members/:uid` | DELETE | `useRemoveMemberMutation` | Hapus anggota |

---

### 3.2 Calendar (Modul 2)

| Endpoint | Method | Hook / Mutation | Keterangan |
|----------|--------|-----------------|------------|
| `GET /events?month=YYYY-MM` | GET | `useEventsQuery(month)` | Event bulan ini |
| `GET /events/:id` | GET | `useEventQuery(id)` | Detail event |
| `POST /events` | POST | `useCreateEventMutation` | Tambah event |
| `PUT /events/:id` | PUT | `useUpdateEventMutation` | Edit event |
| `DELETE /events/:id` | DELETE | `useDeleteEventMutation` | Hapus event |

---

### 3.3 Tasks (Modul 3)

| Endpoint | Method | Hook / Mutation | Keterangan |
|----------|--------|-----------------|------------|
| `GET /tasks` | GET | `useTasksQuery(filters)` | List tugas dengan filter |
| `GET /tasks/:id` | GET | `useTaskQuery(id)` | Detail tugas |
| `POST /tasks` | POST | `useCreateTaskMutation` | Tambah tugas |
| `PUT /tasks/:id` | PUT | `useUpdateTaskMutation` | Edit tugas |
| `PATCH /tasks/:id/complete` | PATCH | `useCompleteTaskMutation` | Tandai selesai |
| `DELETE /tasks/:id` | DELETE | `useDeleteTaskMutation` | Hapus tugas |
| `GET /tasks/leaderboard` | GET | `useLeaderboardQuery` | Papan poin |

---

### 3.4 Budget (Modul 4)

| Endpoint | Method | Hook / Mutation | Keterangan |
|----------|--------|-----------------|------------|
| `GET /expenses?month=YYYY-MM` | GET | `useExpensesQuery(month)` | List pengeluaran |
| `POST /expenses` | POST | `useCreateExpenseMutation` | Tambah transaksi |
| `PUT /expenses/:id` | PUT | `useUpdateExpenseMutation` | Edit transaksi |
| `DELETE /expenses/:id` | DELETE | `useDeleteExpenseMutation` | Hapus transaksi |
| `GET /budgets?month=YYYY-MM` | GET | `useBudgetsQuery(month)` | Budget per kategori |
| `POST /budgets` | POST | `useSetBudgetMutation` | Set budget kategori |
| `GET /shopping-list` | GET | `useShoppingListQuery` | Daftar belanja |
| `POST /shopping-list` | POST | `useAddShoppingItemMutation` | Tambah item belanja |
| `PATCH /shopping-list/:id/check` | PATCH | `useCheckShoppingItemMutation` | Centang item |

---

### 3.5 Memories (Modul 5)

| Endpoint | Method | Hook / Mutation | Keterangan |
|----------|--------|-----------------|------------|
| `GET /memories?page=N` | GET | `useMemoriesQuery(page)` | List memories (paginated) |
| `GET /memories/:id` | GET | `useMemoryQuery(id)` | Detail memory |
| `POST /memories` | POST | `useCreateMemoryMutation` | Upload foto + data |
| `PUT /memories/:id` | PUT | `useUpdateMemoryMutation` | Edit caption/tag |
| `DELETE /memories/:id` | DELETE | `useDeleteMemoryMutation` | Hapus memory |

---

### 3.6 Kids (Modul 6)

| Endpoint | Method | Hook / Mutation | Keterangan |
|----------|--------|-----------------|------------|
| `GET /kids` | GET | `useKidsQuery` | Daftar anak |
| `POST /kids` | POST | `useCreateKidMutation` | Tambah profil anak |
| `PUT /kids/:id` | PUT | `useUpdateKidMutation` | Update profil anak |
| `GET /kids/:id/growth` | GET | `useKidGrowthQuery(id)` | Data pertumbuhan |
| `POST /kids/:id/growth` | POST | `useAddGrowthMutation` | Tambah data ukur |
| `GET /kids/:id/vaccines` | GET | `useVaccinesQuery(id)` | Riwayat vaksin |
| `POST /kids/:id/vaccines` | POST | `useAddVaccineMutation` | Tambah vaksin |

---

### 3.7 Documents (Modul 7)

| Endpoint | Method | Hook / Mutation | Keterangan |
|----------|--------|-----------------|------------|
| `GET /documents` | GET | `useDocumentsQuery(filters)` | List dokumen |
| `POST /documents` | POST | `useUploadDocumentMutation` | Upload dokumen |
| `GET /documents/:id` | GET | `useDocumentQuery(id)` | Detail dokumen |
| `PUT /documents/:id` | PUT | `useUpdateDocumentMutation` | Edit metadata |
| `DELETE /documents/:id` | DELETE | `useDeleteDocumentMutation` | Hapus dokumen |

---

## 4. Komponen Reusable Antar Modul

Komponen yang dapat digunakan ulang di lebih dari satu modul:

| Komponen | Dipakai di Modul |
|----------|-----------------|
| `AvatarGroup` | Calendar, Tasks, Memories, Dashboard |
| `DatePicker` | Calendar, Tasks, Budget, Kids |
| `FileUploader` | Memories, Documents, Kids (foto profil) |
| `EmptyState` | Semua modul |
| `LoadingSkeleton` | Semua modul |
| `MemberBadge` | Calendar, Tasks, Budget |
| `CategoryBadge` | Tasks, Budget, Documents |
| `ConfirmDialog` | Semua modul (hapus data) |
| `PageHeader` | Semua halaman |
| `SectionCard` | Dashboard, semua detail page |

---

## 5. Rencana Komponen per Modul

### 5.1 Modul Auth & Family

**Halaman:**
- `/login` — Halaman login
- `/register` — Halaman register
- `/onboarding` — Buat atau join keluarga
- `/settings/profile` — Edit profil user
- `/settings/family` — Kelola anggota keluarga

**Komponen:**
```
app/(auth)/login/page.tsx
  └── LoginForm (Client)
       ├── GoogleOAuthButton
       ├── EmailInput
       ├── PasswordInput (dengan toggle)
       └── useLoginMutation

app/(auth)/register/page.tsx
  └── RegisterForm (Client)
       └── useRegisterMutation

app/(auth)/onboarding/page.tsx
  └── OnboardingFlow (Client)
       ├── CreateFamilyStep
       └── JoinFamilyStep

app/settings/family/page.tsx
  └── FamilySettingsPage (Client)
       ├── MemberList
       │   └── MemberCard (edit role, warna, hapus)
       ├── InviteCodeCard
       └── useMembersQuery, useRemoveMemberMutation
```

**Urutan pengerjaan:**
1. `GoogleOAuthButton` (reusable)
2. `LoginForm` + `useLoginMutation`
3. `RegisterForm` + `useRegisterMutation`
4. `OnboardingFlow` + mutations
5. `FamilySettingsPage` + `MemberCard`

---

### 5.2 Modul Calendar

**Halaman:**
- `/calendar` — Kalender utama (view bulan/minggu/hari)

**Komponen:**
```
app/calendar/page.tsx
  └── CalendarPage (Server)
       └── CalendarView (Client)
            ├── CalendarHeader (navigasi bulan + toggle view)
            ├── MemberFilterBar
            │   └── CalendarMemberBadge[]
            ├── MonthView
            │   ├── CalendarGrid
            │   └── DayCell
            │       └── EventCard[]
            ├── WeekView
            │   └── TimeGrid
            │       └── EventCard[]
            ├── DayView
            │   └── DaySchedule
            ├── EventFormModal (tambah/edit event)
            │   ├── TitleInput
            │   ├── DateRangePicker
            │   ├── MemberMultiSelect
            │   ├── ColorPicker
            │   └── RecurrenceSelect
            └── useEventsQuery, useCalendarStore
```

**Urutan pengerjaan:**
1. `EventCard` (komponen terkecil)
2. `CalendarMemberBadge`
3. `MonthView` + `DayCell`
4. `CalendarHeader` + filter
5. `EventFormModal`
6. `WeekView` + `DayView`

---

### 5.3 Modul Tasks

**Halaman:**
- `/tasks` — Daftar & manajemen tugas

**Komponen:**
```
app/tasks/page.tsx
  └── TasksPage (Server)
       └── TasksView (Client)
            ├── TaskFilterBar (status, member, category, sort)
            ├── TaskListView
            │   └── TaskCard[]
            ├── KanbanView (opsional)
            │   ├── KanbanColumn (Todo / In Progress / Done)
            │   └── TaskCard[]
            ├── LeaderboardPanel
            │   └── LeaderboardItem[]
            ├── TaskFormModal (tambah/edit)
            │   ├── TitleInput
            │   ├── DescriptionTextarea
            │   ├── CategorySelect
            │   ├── PrioritySelect
            │   ├── AssigneeMultiSelect
            │   ├── DueDatePicker
            │   └── PointsInput
            └── useTasksQuery, useTaskFilterStore
```

**Urutan pengerjaan:**
1. `TaskCard` + states (completed, overdue)
2. `TaskFilterBar`
3. `TaskListView`
4. `TaskFormModal`
5. `LeaderboardPanel`
6. `KanbanView` (jika diperlukan)

---

### 5.4 Modul Budget

**Halaman:**
- `/budget` — Budget & expense tracker (tab: Transaksi, Budget, Belanja)

**Komponen:**
```
app/budget/page.tsx
  └── BudgetPage (Server)
       └── BudgetView (Client)
            ├── BudgetTabNav (Transaksi | Budget | Belanja)
            ├── MonthSelector
            │
            ├── [Tab: Transaksi]
            │   ├── BudgetSummaryChart
            │   ├── ExpenseFilterBar
            │   └── ExpenseList
            │       └── ExpenseCard[]
            │
            ├── [Tab: Budget]
            │   └── BudgetCategoryList
            │       └── BudgetProgressCard[]
            │
            ├── [Tab: Belanja]
            │   └── ShoppingList
            │       └── ShoppingItem[]
            │
            ├── AddExpenseModal
            │   ├── AmountInput (dengan Rp formatter)
            │   ├── CategorySelect
            │   ├── DatePicker
            │   ├── NoteInput
            │   └── MemberSelect
            └── useExpensesQuery, useBudgetsQuery, useBudgetStore
```

**Urutan pengerjaan:**
1. `ExpenseCard`
2. `BudgetProgressCard`
3. `BudgetSummaryChart`
4. `AddExpenseModal`
5. `ExpenseList` + `ExpenseFilterBar`
6. `BudgetCategoryList`
7. `ShoppingList`

---

### 5.5 Modul Memories

**Halaman:**
- `/memories` — Grid foto & kenangan

**Komponen:**
```
app/memories/page.tsx
  └── MemoriesPage (Server)
       └── MemoriesView (Client)
            ├── MemoryFilterBar (by member, tag, bulan)
            ├── MemoryGrid (masonry atau uniform grid)
            │   └── MemoryCard[]
            ├── MemoryDetailModal (lightbox)
            │   ├── FullImage
            │   ├── Caption + tags
            │   ├── MemberBadges
            │   └── ActionButtons (edit, hapus)
            ├── AddMemoryModal
            │   ├── FileUploader
            │   ├── CaptionInput
            │   ├── DatePicker
            │   ├── MemberMultiSelect
            │   └── TagInput
            └── useMemoriesQuery (infinite scroll)
```

**Urutan pengerjaan:**
1. `MemoryCard`
2. `MemoryGrid`
3. `MemoryDetailModal`
4. `AddMemoryModal` + `FileUploader`
5. `MemoryFilterBar`
6. Infinite scroll (useInfiniteQuery)

---

### 5.6 Modul Kids

**Halaman:**
- `/kids` — Daftar & profil anak
- `/kids/:id` — Detail anak (pertumbuhan, vaksin, milestone)

**Komponen:**
```
app/kids/page.tsx
  └── KidsPage (Server)
       └── KidsView (Client)
            └── KidProfileCard[] (satu per anak)
                → klik: navigate ke /kids/:id

app/kids/[id]/page.tsx
  └── KidDetailPage (Server)
       └── KidDetailView (Client)
            ├── KidProfileHeader (foto, nama, usia)
            ├── KidTabNav (Pertumbuhan | Vaksin | Milestone)
            │
            ├── [Tab: Pertumbuhan]
            │   ├── GrowthMetrics (BB/TB/IMT terkini)
            │   ├── KidsGrowthChart
            │   └── GrowthRecordList
            │       └── GrowthRecordItem[]
            │
            ├── [Tab: Vaksin]
            │   └── VaccineTimeline
            │       └── VaccineItem[]
            │
            └── [Tab: Milestone]
                └── MilestoneList
                    └── MilestoneItem[]
```

**Urutan pengerjaan:**
1. `KidProfileCard`
2. `KidProfileHeader`
3. `GrowthMetrics`
4. `KidsGrowthChart`
5. `GrowthRecordList` + modal tambah ukuran
6. `VaccineTimeline`
7. `MilestoneList`

---

### 5.7 Modul Documents

**Halaman:**
- `/documents` — Dokumen keluarga (grid + kategori)

**Komponen:**
```
app/documents/page.tsx
  └── DocumentsPage (Server)
       └── DocumentsView (Client)
            ├── DocumentFilterBar (kategori, member)
            ├── CategoryTabNav
            ├── DocumentGrid
            │   └── DocumentCard[]
            │       ├── FileTypeIcon
            │       ├── FileName
            │       ├── FileSize + tanggal upload
            │       └── UploadedByAvatar
            ├── DocumentDetailModal
            │   ├── Preview (PDF inline / gambar)
            │   └── Metadata (nama, kategori, tanggal)
            └── UploadDocumentModal
                ├── FileUploader
                ├── NameInput
                ├── CategorySelect
                └── MemberSelect
```

**Urutan pengerjaan:**
1. `DocumentCard`
2. `DocumentGrid`
3. `UploadDocumentModal` + `FileUploader`
4. `DocumentDetailModal`
5. `DocumentFilterBar`

---

## 6. Struktur Folder Frontend

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── onboarding/page.tsx
├── (app)/
│   ├── layout.tsx              ← layout utama (sidebar + bottom nav)
│   ├── page.tsx                ← Home Dashboard
│   ├── calendar/page.tsx
│   ├── tasks/page.tsx
│   ├── budget/page.tsx
│   ├── memories/page.tsx
│   ├── kids/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── documents/page.tsx
│   └── settings/
│       ├── profile/page.tsx
│       └── family/page.tsx
│
components/
├── layout/
│   ├── Sidebar.tsx
│   └── BottomNav.tsx
├── ui/                         ← reusable atoms (shadcn + custom)
│   ├── AvatarGroup.tsx
│   ├── DatePicker.tsx
│   ├── FileUploader.tsx
│   ├── EmptyState.tsx
│   └── Skeleton.tsx
├── calendar/
│   ├── EventCard.tsx
│   ├── MemberBadge.tsx
│   ├── MonthView.tsx
│   └── EventFormModal.tsx
├── tasks/
│   ├── TaskCard.tsx
│   ├── TaskFormModal.tsx
│   └── LeaderboardPanel.tsx
├── budget/
│   ├── ExpenseCard.tsx
│   ├── BudgetProgressCard.tsx
│   ├── SummaryChart.tsx
│   └── AddExpenseModal.tsx
├── memories/
│   ├── MemoryCard.tsx
│   └── AddMemoryModal.tsx
├── kids/
│   ├── KidProfileCard.tsx
│   └── GrowthChart.tsx
├── documents/
│   └── DocumentCard.tsx
└── dashboard/
    ├── FamilyActivityWidget.tsx
    ├── UpcomingEventsWidget.tsx
    ├── TaskSummaryWidget.tsx
    ├── BudgetSnapshotWidget.tsx
    ├── MemoryWidget.tsx
    └── ChoreLeaderboardWidget.tsx

hooks/
├── useAuth.ts
├── useFamily.ts
├── useEvents.ts
├── useTasks.ts
├── useBudget.ts
├── useMemories.ts
├── useKids.ts
└── useDocuments.ts

store/
├── authStore.ts
├── sidebarStore.ts
├── calendarStore.ts
├── taskFilterStore.ts
└── budgetStore.ts

lib/
├── api.ts                      ← Axios instance + interceptors
├── queryClient.ts              ← QueryClient config
└── utils.ts                    ← Helper functions (formatRupiah, dll)
```

---

## 7. Urutan Pengerjaan Komponen (Global)

Pengerjaan mengikuti prinsip **bottom-up: atomic → molekul → halaman**.

```
1. lib/ setup     : api.ts, queryClient.ts, utils.ts
2. store/ setup   : authStore, sidebarStore
3. layout         : Sidebar, BottomNav, app layout
4. ui/ atoms      : AvatarGroup, DatePicker, FileUploader, EmptyState, Skeleton
5. Auth           : LoginForm, RegisterForm, OnboardingFlow
6. Dashboard      : Semua widget dashboard
7. Calendar       : EventCard → MonthView → WeekView → EventFormModal
8. Tasks          : TaskCard → TaskListView → TaskFormModal → Leaderboard
9. Budget         : ExpenseCard → BudgetProgressCard → Chart → Modals
10. Memories      : MemoryCard → Grid → Modals → Infinite scroll
11. Kids          : KidProfileCard → GrowthChart → VaccineTimeline
12. Documents     : DocumentCard → Grid → Modals
13. Settings      : ProfilePage → FamilySettings
```

---

## 8. Konvensi Kode

```
Naming:
  Komponen   : PascalCase  → TaskCard.tsx
  Hook       : camelCase + "use" prefix → useTasksQuery.ts
  Store      : camelCase + "Store" suffix → taskFilterStore.ts
  Util       : camelCase → formatRupiah.ts

Props:
  Selalu definisikan interface props di file yang sama
  Hindari prop drilling > 2 level → gunakan Context atau Zustand

Data fetching:
  TIDAK boleh fetch langsung di dalam komponen
  Selalu melalui hook di hooks/ yang menggunakan useQuery / useMutation

Error handling:
  Semua query harus handle: loading → EmptyState/Skeleton, error → ErrorCard
  Form validation menggunakan Zod schema + React Hook Form
```
