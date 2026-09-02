"use client";

import { useState, useCallback } from "react";
import { format, getMonth, getYear } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Target, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ExpenseModal, type ExpenseFormValues, EXPENSE_CATEGORIES } from "@/components/budget/ExpenseModal";
import { BudgetProgress } from "@/components/budget/BudgetProgress";
import { ShoppingList } from "@/components/budget/ShoppingList";
import { GoalCard } from "@/components/budget/GoalCard";
import { GoalModal, type GoalFormValues } from "@/components/budget/GoalModal";
import { AddFundModal } from "@/components/budget/AddFundModal";
import {
  useExpenses,
  useBudgetSummary,
  useBudgets,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useUpsertBudget,
} from "@/hooks/useBudget";
import {
  useFinancialGoals,
  useCreateGoal,
  useUpdateGoal,
  useAddFund,
  useDeleteGoal,
} from "@/hooks/useFinancialGoals";
import type { Expense, FinancialGoal } from "@/types";

// ─── Tab utama ────────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { value: "keuangan", label: "Keuangan Keluarga" },
  { value: "target",   label: "Target Keluarga" },
] as const;
type MainTabValue = typeof MAIN_TABS[number]["value"];

// ─── Sub-tab (dalam Keuangan Keluarga) ───────────────────────────────────────

const SUB_TABS = [
  { value: "expenses",  label: "Pengeluaran" },
  { value: "budgets",   label: "Target Budget" },
  { value: "shopping",  label: "Belanja" },
] as const;
type SubTabValue = typeof SUB_TABS[number]["value"];

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const now = new Date();

  // ── Main tab state
  const [mainTab, setMainTab] = useState<MainTabValue>("keuangan");

  // ── Keuangan sub-tab state
  const [currentDate, setCurrentDate] = useState(now);
  const [subTab, setSubTab]           = useState<SubTabValue>("expenses");
  const [catFilter, setCatFilter]     = useState("");
  const [modalOpen, setModalOpen]     = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [budgetModal, setBudgetModal]       = useState(false);
  const [editCategory, setEditCategory]     = useState("");
  const [editBudgetAmt, setEditBudgetAmt]   = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editBudgetId, setEditBudgetId]     = useState<string | undefined>();

  // ── Target keluarga state
  const [goalModalOpen, setGoalModalOpen]       = useState(false);
  const [selectedGoal, setSelectedGoal]         = useState<FinancialGoal | null>(null);
  const [addFundGoal, setAddFundGoal]           = useState<FinancialGoal | null>(null);

  const month = getMonth(currentDate) + 1;
  const year  = getYear(currentDate);

  // ── Keuangan hooks
  const { data: expenses = [], isLoading: expLoading } = useExpenses(month, year, catFilter);
  const { data: summary }                               = useBudgetSummary(month, year);
  const { data: budgets = [] }                          = useBudgets(month, year);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const upsertBudget  = useUpsertBudget();

  // ── Target hooks
  const { data: goals = [], isLoading: goalsLoading } = useFinancialGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const addFund    = useAddFund();
  const deleteGoal = useDeleteGoal();

  const navigateMonth = (dir: -1 | 1) => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  // ── Expense handlers
  const handleSaveExpense = async (values: ExpenseFormValues) => {
    try {
      if (selectedExpense) {
        await updateExpense.mutateAsync({ id: selectedExpense.id, ...values });
        toast.success("Pengeluaran diperbarui");
      } else {
        await createExpense.mutateAsync(values);
        toast.success("Pengeluaran ditambahkan");
      }
      setModalOpen(false);
    } catch {
      toast.error("Gagal menyimpan pengeluaran");
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    try {
      await deleteExpense.mutateAsync(selectedExpense.id);
      toast.success("Pengeluaran dihapus");
      setModalOpen(false);
    } catch {
      toast.error("Gagal menghapus pengeluaran");
    }
  };

  const handleOpenBudgetEdit = useCallback((category: string, currentAmount: number, budgetId?: string) => {
    setEditCategory(category);
    setEditBudgetAmt(currentAmount);
    setEditBudgetId(budgetId);
    setBudgetModal(true);
  }, []);

  const handleSaveBudget = async () => {
    try {
      await upsertBudget.mutateAsync({ category: editCategory, amount: editBudgetAmt, month, year });
      toast.success("Target budget disimpan");
      setBudgetModal(false);
    } catch {
      toast.error("Gagal menyimpan budget");
    }
  };

  // ── Goal handlers
  const handleSaveGoal = async (values: GoalFormValues) => {
    try {
      if (selectedGoal) {
        await updateGoal.mutateAsync({
          id: selectedGoal.id,
          title: values.title,
          target_amount: values.target_amount,
          current_amount: values.current_amount,
          deadline: values.deadline || null,
          notes: values.notes,
        });
        toast.success("Target diperbarui");
      } else {
        await createGoal.mutateAsync({
          title: values.title,
          target_amount: values.target_amount,
          current_amount: values.current_amount,
          deadline: values.deadline || null,
          notes: values.notes,
        });
        toast.success("Target ditambahkan 🎯");
      }
      setGoalModalOpen(false);
    } catch {
      toast.error("Gagal menyimpan target");
    }
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;
    try {
      await deleteGoal.mutateAsync(selectedGoal.id);
      toast.success("Target dihapus");
      setGoalModalOpen(false);
    } catch {
      toast.error("Gagal menghapus target");
    }
  };

  const handleAddFund = async (amount: number) => {
    if (!addFundGoal) return;
    try {
      const updated = await addFund.mutateAsync({ id: addFundGoal.id, amount });
      setAddFundGoal(null);
      if (updated?.is_achieved) {
        toast.success("🎉 Target tercapai! Selamat!");
      } else {
        toast.success("Dana berhasil ditambahkan");
      }
    } catch {
      toast.error("Gagal menambah dana");
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary-500" />
          <h1 className="text-xl font-bold text-neutral-900">Keuangan Keluarga</h1>
        </div>
        {mainTab === "keuangan" && (
          <Button
            onClick={() => { setSelectedExpense(null); setModalOpen(true); }}
            size="sm"
            className="gap-1.5 bg-primary-500 hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Catat</span>
          </Button>
        )}
        {mainTab === "target" && (
          <Button
            onClick={() => { setSelectedGoal(null); setGoalModalOpen(true); }}
            size="sm"
            className="gap-1.5 bg-primary-500 hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah Target</span>
          </Button>
        )}
      </div>

      {/* ── Main Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1">
        {MAIN_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setMainTab(value)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              mainTab === value
                ? "bg-primary-500 text-white shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — KEUANGAN KELUARGA
      ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === "keuangan" && (
        <div className="space-y-5">
          {/* Month navigator + summary */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => navigateMonth(-1)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-base font-semibold text-neutral-800 capitalize">
                {format(currentDate, "MMMM yyyy", { locale: dateLocale })}
              </h2>
              <button onClick={() => navigateMonth(1)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3 text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Total Pengeluaran</p>
                <p className="text-base font-bold text-neutral-900 dark:text-neutral-50">{formatRp(summary?.total ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3 text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Transaksi</p>
                <p className="text-base font-bold text-neutral-900 dark:text-neutral-50">{expenses.length}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg bg-primary-50 p-3 text-center">
                <p className="text-xs text-primary-600 mb-1">Kategori terbesar</p>
                <p className="text-base font-bold text-primary-700 truncate">
                  {summary?.by_category?.[0]?.category ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-1">
            {SUB_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSubTab(value)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors",
                  subTab === value
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sub-tab content */}
          {subTab === "expenses" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCatFilter("")}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    !catFilter ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  )}
                >
                  Semua
                </button>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatFilter(catFilter === cat ? "" : cat)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      catFilter === cat ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {expLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
              ) : expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-14 text-center">
                  <Wallet className="mb-3 h-10 w-10 text-neutral-200" />
                  <p className="text-sm font-medium text-neutral-500">Belum ada pengeluaran bulan ini</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <button
                      key={expense.id}
                      onClick={() => { setSelectedExpense(expense); setModalOpen(true); }}
                      className="w-full flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-left hover:shadow-sm transition-shadow"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{expense.category}</p>
                        <p className="text-xs text-neutral-400 truncate">{expense.description || expense.date.slice(0, 10)}</p>
                      </div>
                      <p className="ml-3 flex-shrink-0 text-sm font-bold text-neutral-900 dark:text-neutral-50">{formatRp(expense.amount)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {subTab === "budgets" && (
            <BudgetProgress
              budgets={budgets}
              actuals={summary?.by_category ?? []}
              onEdit={handleOpenBudgetEdit}
            />
          )}

          {subTab === "shopping" && <ShoppingList />}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — TARGET KELUARGA
      ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === "target" && (
        <div className="space-y-4">
          {goalsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-20 text-center px-8">
              <Target className="mb-4 h-12 w-12 text-neutral-200" />
              <p className="text-base font-semibold text-neutral-700">Belum ada target keuangan</p>
              <p className="mt-1.5 text-sm text-neutral-400 max-w-xs">
                Klik <strong>&quot;Tambah Target&quot;</strong> untuk mulai menetapkan tujuan keuangan keluarga — dana darurat, liburan, beli rumah, dan lainnya.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={(g) => { setSelectedGoal(g); setGoalModalOpen(true); }}
                  onDelete={(g) => { setSelectedGoal(g); setGoalModalOpen(true); }}
                  onAddFund={(g) => setAddFundGoal(g)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Expense modal ─────────────────────────────────────────────────── */}
      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveExpense}
        onDelete={selectedExpense ? handleDeleteExpense : undefined}
        expense={selectedExpense}
        isSaving={createExpense.isPending || updateExpense.isPending}
        isDeleting={deleteExpense.isPending}
      />

      {/* ── Budget target inline modal ────────────────────────────────────── */}
      {budgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBudgetModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-50">
              Target Budget — {editCategory}
            </h3>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nominal (Rp)</label>
            <input
              type="number"
              min={0}
              value={editBudgetAmt}
              onChange={(e) => setEditBudgetAmt(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setBudgetModal(false)}>Batal</Button>
              <Button
                onClick={handleSaveBudget}
                disabled={upsertBudget.isPending}
                className="bg-primary-500 hover:bg-primary-600"
              >
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Goal modal ────────────────────────────────────────────────────── */}
      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        onSave={handleSaveGoal}
        onDelete={selectedGoal ? handleDeleteGoal : undefined}
        goal={selectedGoal}
        isSaving={createGoal.isPending || updateGoal.isPending}
        isDeleting={deleteGoal.isPending}
      />

      {/* ── Add Fund modal ────────────────────────────────────────────────── */}
      <AddFundModal
        goal={addFundGoal}
        onClose={() => setAddFundGoal(null)}
        onConfirm={handleAddFund}
        isSaving={addFund.isPending}
      />
    </div>
  );
}

