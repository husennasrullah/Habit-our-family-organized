# Financial Goals — Plan

## Top-Level Overview

Tambah fitur **Target Keluarga** (financial goals jangka panjang) sebagai tab kedua di halaman Budget.
Halaman Budget akan direstrukturisasi menjadi **2 tab utama**:

- **Tab 1 — Keuangan Keluarga**: semua konten yang sudah ada (Pengeluaran, Target Budget bulanan, Belanja) dipindah ke dalam tab ini
- **Tab 2 — Target Keluarga**: fitur baru untuk set target keuangan jangka panjang dengan deadline dan update progress manual

Scope:
- DB migration baru (tabel `financial_goals`)
- Backend: model, repo, service, handler, route
- Frontend: types, hook, komponen UI, integrasi ke halaman Budget

---

## Sub-Tasks

---

### Sub-Task 1 — DB Migration: Tabel `financial_goals`

**Intent:** Buat tabel baru untuk menyimpan target keuangan jangka panjang keluarga.

**Expected Outcomes:**
- File migration SQL baru tersedia
- Tabel terbuat di PostgreSQL dengan field yang sesuai

**Todo List:**
1. Buat file `backend/migrations/006_financial_goals.sql`
2. Definisikan tabel `financial_goals` dengan field:
   - `id` UUID PK
   - `family_id` UUID FK → families
   - `created_by` UUID FK → family_members
   - `title` TEXT NOT NULL (nama target, cth: "Dana Darurat", "Liburan Eropa")
   - `target_amount` NUMERIC(15,2) NOT NULL
   - `current_amount` NUMERIC(15,2) NOT NULL DEFAULT 0
   - `deadline` DATE (nullable — opsional)
   - `notes` TEXT DEFAULT ''
   - `is_achieved` BOOLEAN DEFAULT false
   - `created_at`, `updated_at`, `deleted_at` TIMESTAMPTZ

**Relevant Context:**
- Pattern migration: [`backend/migrations/004_budget.sql`](backend/migrations/004_budget.sql)

**Status:** `[ ] pending`

---

### Sub-Task 2 — Backend: Model, Repo, Service, Handler, Route

**Intent:** Expose CRUD API untuk `financial_goals` dengan pola yang konsisten dengan fitur lain.

**Expected Outcomes:**
- `GET /financial-goals` → list goals milik family
- `POST /financial-goals` → buat goal baru
- `PUT /financial-goals/:id` → update (title, amount, deadline, notes, is_achieved)
- `PATCH /financial-goals/:id/progress` → tambah dana: terima `amount` yang di-**increment** ke `current_amount` (bukan replace), auto set `is_achieved = true` jika `current_amount >= target_amount`
- `DELETE /financial-goals/:id` → hapus goal

**Todo List:**
1. Buat `backend/internal/models/financial_goal.go` — struct `FinancialGoal`
2. Buat `backend/internal/repositories/financial_goal_repo.go` — CRUD methods
3. Buat `backend/internal/services/financial_goal_service.go` — DTO + business logic (validasi amount > 0, auto set `is_achieved` jika `current_amount >= target_amount`)
4. Buat `backend/internal/handlers/financial_goal_handler.go` — Fiber handlers
5. Daftarkan routes di `backend/cmd/main.go` dalam group yang sudah ada (auth-protected)

**Relevant Context:**
- Pattern model: [`backend/internal/models/memory.go`](backend/internal/models/memory.go)
- Pattern repo: [`backend/internal/repositories/memory_repo.go`](backend/internal/repositories/memory_repo.go)
- Pattern service: [`backend/internal/services/memory_service.go`](backend/internal/services/memory_service.go)
- Pattern handler: [`backend/internal/handlers/memory_handler.go`](backend/internal/handlers/memory_handler.go)
- Route registration: `backend/cmd/main.go`

**Status:** `[ ] pending`

---

### Sub-Task 3 — Frontend: Types & Hook

**Intent:** Tambah TypeScript type dan React Query hook untuk financial goals.

**Expected Outcomes:**
- `FinancialGoal` interface tersedia di `frontend/types/index.ts`
- Hook `useFinancialGoals`, `useCreateGoal`, `useUpdateGoal`, `useUpdateProgress`, `useDeleteGoal` tersedia

**Todo List:**
1. Tambah interface `FinancialGoal` di [`frontend/types/index.ts`](frontend/types/index.ts)
2. Buat `frontend/hooks/useFinancialGoals.ts` dengan semua mutation hooks menggunakan React Query (pola sama dengan `useMemories.ts`)

**Relevant Context:**
- Pattern hook: [`frontend/hooks/useMemories.ts`](frontend/hooks/useMemories.ts)
- Types: [`frontend/types/index.ts`](frontend/types/index.ts)

**Status:** `[ ] pending`

---

### Sub-Task 4 — Frontend: Komponen GoalCard & GoalModal

**Intent:** Buat komponen UI untuk menampilkan satu goal (card dengan progress bar) dan modal untuk tambah/edit goal.

**Expected Outcomes:**
- `GoalCard` — tampilkan title, progress bar (current/target), deadline, badge "Tercapai" jika `is_achieved`
- `GoalModal` — form tambah/edit: title, target_amount, current_amount, deadline (opsional), notes

**Todo List:**
1. Buat `frontend/components/budget/GoalCard.tsx`
   - Progress bar visual: `(current_amount / target_amount) * 100`%
   - Warna progress: hijau jika tercapai, primary jika normal
   - Tombol **"Tambah Dana"** selalu tampil → buka `AddFundModal` (mini modal input nominal)
   - Tombol edit dan hapus on hover
   - Badge "Tercapai ✅" + checklist visual jika `is_achieved = true`, card tetap tampil di list
2. Buat `frontend/components/budget/GoalModal.tsx`
   - Field: Nama Target, Nominal Target (Rp), Sudah Terkumpul (Rp, untuk set awal), Deadline (date, opsional), Catatan (opsional)
   - Tombol Simpan + Hapus (jika edit)
3. Buat `frontend/components/budget/AddFundModal.tsx` (mini modal)
   - Input: nominal yang **ditambahkan** (bukan total)
   - Tombol Simpan → hit `PATCH /financial-goals/:id/progress`

**Relevant Context:**
- Pattern card: [`frontend/components/memories/MemoryCard.tsx`](frontend/components/memories/MemoryCard.tsx)
- Pattern modal: [`frontend/components/memories/MemoryModal.tsx`](frontend/components/memories/MemoryModal.tsx)
- Format Rupiah: fungsi `formatRp` di [`frontend/app/(dashboard)/budget/page.tsx`](frontend/app/(dashboard)/budget/page.tsx:36)

**Status:** `[ ] pending`

---

### Sub-Task 5 — Frontend: Integrasi ke Halaman Budget (2 Tab Utama)

**Intent:** Restrukturisasi halaman Budget menjadi 2 tab utama, semua konten lama masuk Tab 1, Tab 2 adalah Target Keluarga.

**Expected Outcomes:**
- Tab bar berubah menjadi 2 tab: "Keuangan Keluarga" dan "Target Keluarga"
- Tab "Keuangan Keluarga" = konten lama (sub-tab Pengeluaran / Target Budget / Belanja tetap ada di dalamnya)
- Tab "Target Keluarga" = grid `GoalCard`, tombol tambah goal, dan `GoalModal`
- Month navigator + summary card hanya tampil di tab "Keuangan Keluarga"

**Todo List:**
1. Update [`frontend/app/(dashboard)/budget/page.tsx`](frontend/app/(dashboard)/budget/page.tsx):
   - Ganti `TABS` array menjadi 2 tab: `keuangan` dan `target`
   - Wrap semua konten lama (month nav, summary, sub-tabs) dalam kondisi `activeTab === "keuangan"`
   - Tambah kondisi `activeTab === "target"` yang render komponen Target Keluarga
2. Buat section Target Keluarga inline atau sebagai komponen terpisah `FinancialGoalsTab` yang:
   - Fetch data via `useFinancialGoals`
   - Tampilkan grid `GoalCard`
   - Tombol "Tambah Target" yang buka `GoalModal`
   - Empty state jika belum ada goal

**Relevant Context:**
- File utama: [`frontend/app/(dashboard)/budget/page.tsx`](frontend/app/(dashboard)/budget/page.tsx)
- Komponen baru: `GoalCard`, `GoalModal` (Sub-Task 4)

**Status:** `[ ] pending`
