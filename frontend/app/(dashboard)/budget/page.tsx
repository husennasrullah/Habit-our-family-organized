"use client";

import { useState } from "react";
import { format, getMonth, getYear } from "date-fns";
import { id as locale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Wallet } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryError } from "@/components/shared/QueryError";
import { ContentState } from "@/components/shared/ContentState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExpenseModal,
  EXPENSE_CATEGORIES,
  type ExpenseFormValues,
} from "@/components/budget/ExpenseModal";
import { BudgetProgress } from "@/components/budget/BudgetProgress";
import {
  BudgetModal,
  type BudgetValues,
} from "@/components/budget/BudgetModal";
import { ShoppingList } from "@/components/budget/ShoppingList";
import { GoalCard } from "@/components/budget/GoalCard";
import { GoalModal, type GoalFormValues } from "@/components/budget/GoalModal";
import { GoalHistoryModal } from "@/components/budget/GoalHistoryModal";
import { AddFundModal } from "@/components/budget/AddFundModal";
import {
  useExpenses,
  useBudgetSummary,
  useBudgets,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useUpsertBudget,
  useDeleteBudget,
  useCheckoutShopping,
} from "@/hooks/useBudget";
import {
  useFinancialGoals,
  useCreateGoal,
  useUpdateGoal,
  useAddFund,
  useDeleteGoal,
} from "@/hooks/useFinancialGoals";
import { financeOverview, rupiah } from "@/lib/finance";
import { cn } from "@/lib/utils";
import type { Budget, Expense, FinancialGoal, ShoppingItem } from "@/types";

const TABS = [
  { value: "expenses", label: "Pengeluaran" },
  { value: "budgets", label: "Anggaran" },
  { value: "goals", label: "Tabungan" },
  { value: "shopping", label: "Belanja" },
] as const;
type Tab = (typeof TABS)[number]["value"];
function reportError(error: unknown, fallback: string) {
  toast.error(
    isAxiosError(error) && typeof error.response?.data?.message === "string"
      ? error.response.data.message
      : fallback,
  );
}

export default function BudgetPage() {
  const [tab, setTab] = useState<Tab>("expenses");
  const [date, setDate] = useState(new Date());
  const month = getMonth(date) + 1,
    year = getYear(date);
  const period = format(date, "MMMM yyyy", { locale });
  const [category, setCategory] = useState("");
  const expenses = useExpenses(month, year, category),
    summary = useBudgetSummary(month, year),
    budgets = useBudgets(month, year),
    goals = useFinancialGoals();
  const createExpense = useCreateExpense(),
    updateExpense = useUpdateExpense(),
    deleteExpense = useDeleteExpense(),
    upsertBudget = useUpsertBudget(),
    deleteBudget = useDeleteBudget(),
    checkout = useCheckoutShopping();
  const createGoal = useCreateGoal(),
    updateGoal = useUpdateGoal(),
    addFund = useAddFund(),
    deleteGoal = useDeleteGoal();
  const [expenseDialog, setExpenseDialog] = useState<{
    expense?: Expense;
    items?: ShoppingItem[];
  } | null>(null);
  const [budgetDialog, setBudgetDialog] = useState<{
    budget?: Budget;
    category?: string;
  } | null>(null);
  const [goalDialog, setGoalDialog] = useState<{ goal?: FinancialGoal } | null>(
    null,
  );
  const [fundGoal, setFundGoal] = useState<FinancialGoal | null>(null);
  const [historyGoal, setHistoryGoal] = useState<FinancialGoal | null>(null);
  const overview = financeOverview(
    budgets.data ?? [],
    summary.data?.by_category ?? [],
  );
  const monthlyError = budgets.isError || summary.isError;
  const monthlyPending = budgets.isPending || summary.isPending;
  const expensePending =
    createExpense.isPending || updateExpense.isPending || checkout.isPending;
  const categories = Array.from(
    new Set([
      ...EXPENSE_CATEGORIES,
      ...(summary.data?.by_category ?? []).map((a) => a.category),
      ...(budgets.data ?? []).map((b) => b.category),
    ]),
  );

  async function saveExpense(values: ExpenseFormValues) {
    if (expensePending) return;
    try {
      if (expenseDialog?.items) {
        await checkout.mutateAsync({
          ...values,
          item_ids: expenseDialog.items.map((i) => i.id),
        });
        toast.success("Belanja selesai dan pengeluaran tercatat");
        setDate(new Date(`${values.date}T12:00:00`));
        setCategory("");
        setTab("expenses");
      } else if (expenseDialog?.expense) {
        await updateExpense.mutateAsync({
          id: expenseDialog.expense.id,
          ...values,
        });
        toast.success("Pengeluaran diperbarui");
      } else {
        await createExpense.mutateAsync(values);
        setDate(new Date(`${values.date}T12:00:00`));
        toast.success("Pengeluaran ditambahkan");
      }
      setExpenseDialog(null);
    } catch (error) {
      reportError(error, "Gagal menyimpan pengeluaran");
    }
  }
  async function saveBudget(values: BudgetValues) {
    if (upsertBudget.isPending) return;
    try {
      await upsertBudget.mutateAsync({ ...values, month, year });
      setBudgetDialog(null);
      toast.success("Anggaran disimpan");
    } catch (error) {
      reportError(error, "Gagal menyimpan anggaran");
    }
  }
  async function saveGoal(values: GoalFormValues) {
    if (createGoal.isPending || updateGoal.isPending) return;
    try {
      const payload = {
        title: values.title,
        target_amount: values.target_amount,
        deadline: values.deadline,
        notes: values.notes,
      };
      if (goalDialog?.goal)
        await updateGoal.mutateAsync({
          id: goalDialog.goal.id,
          ...payload,
          ...(values.adjust_balance
            ? { current_amount: values.current_amount }
            : {}),
        });
      else
        await createGoal.mutateAsync({
          ...payload,
          current_amount: values.current_amount,
        });
      setGoalDialog(null);
      toast.success("Tabungan disimpan");
    } catch (error) {
      reportError(error, "Gagal menyimpan tabungan");
    }
  }
  async function confirmFund(amount: number, note: string) {
    if (!fundGoal || addFund.isPending) return;
    try {
      const updated = await addFund.mutateAsync({
        id: fundGoal.id,
        amount,
        note,
      });
      setFundGoal(null);
      toast.success(
        updated.is_achieved ? "Target tabungan tercapai!" : "Setoran tercatat",
      );
    } catch (error) {
      reportError(error, "Gagal menambah dana");
    }
  }
  const headerAction =
    tab === "expenses" ? (
      <Button onClick={() => setExpenseDialog({})}>
        <Plus size={16} />
        Catat pengeluaran
      </Button>
    ) : tab === "budgets" ? (
      <Button onClick={() => setBudgetDialog({})}>
        <Plus size={16} />
        Buat anggaran
      </Button>
    ) : tab === "goals" ? (
      <Button onClick={() => setGoalDialog({})}>
        <Plus size={16} />
        Tambah tabungan
      </Button>
    ) : undefined;
  return (
    <div className="w-full min-w-0 space-y-4">
      <PageHeader
        title="Keuangan"
        description="Atur pengeluaran, jaga anggaran, dan wujudkan tabungan keluarga."
        action={headerAction}
      />
      <div
        className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1"
        role="tablist"
        aria-label="Menu keuangan"
      >
        {TABS.map((item) => (
          <button
            key={item.value}
            id={`finance-tab-${item.value}`}
            role="tab"
            aria-selected={tab === item.value}
            aria-controls={`finance-panel-${item.value}`}
            tabIndex={tab === item.value ? 0 : -1}
            onKeyDown={(event) => {
              const index = TABS.findIndex((t) => t.value === tab);
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
              else if (event.key === "ArrowLeft")
                next = (index + TABS.length - 1) % TABS.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = TABS.length - 1;
              else return;
              event.preventDefault();
              setTab(TABS[next].value);
              document
                .getElementById(`finance-tab-${TABS[next].value}`)
                ?.focus();
            }}
            onClick={() => setTab(item.value)}
            className={cn(
              "min-h-9 flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold",
              tab === item.value
                ? "bg-primary-600 text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`finance-panel-${tab}`}
        aria-labelledby={`finance-tab-${tab}`}
        className="space-y-4"
      >
        {(tab === "expenses" || tab === "budgets") && (
          <>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  aria-label="Bulan sebelumnya"
                  onClick={() => setDate(new Date(year, month - 2, 1))}
                  className="rounded-lg p-2 hover:bg-muted"
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 className="text-sm font-semibold capitalize">{period}</h2>
                <button
                  aria-label="Bulan berikutnya"
                  onClick={() => setDate(new Date(year, month, 1))}
                  className="rounded-lg p-2 hover:bg-muted"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Anggaran bulan ini",
                    value:
                      overview.allocated > 0
                        ? rupiah(overview.allocated)
                        : "Belum diatur",
                    note: "Total batas pengeluaran kategori",
                  },
                  {
                    label: "Pengeluaran",
                    value: rupiah(overview.spent),
                    note: `${summary.data?.by_category?.reduce((s, c) => s + c.count, 0) ?? 0} transaksi bulan ini`,
                  },
                  {
                    label:
                      !monthlyError &&
                      !monthlyPending &&
                      overview.allocated > 0 &&
                      overview.remaining < 0
                        ? "Melebihi anggaran"
                        : "Sisa anggaran",
                    value:
                      overview.allocated > 0
                        ? rupiah(Math.abs(overview.remaining))
                        : "Belum diatur",
                    note: "Anggaran dikurangi seluruh pengeluaran",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-muted p-3">
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {monthlyError
                        ? "Tidak tersedia"
                        : monthlyPending
                          ? "Memuat…"
                          : item.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {!monthlyError && !monthlyPending && item.note}
                    </p>
                  </div>
                ))}
              </div>
              {!monthlyError &&
                !monthlyPending &&
                overview.unallocated.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Belum ada anggaran untuk:{" "}
                    {overview.unallocated.map((c) => c.category).join(", ")}.
                    Pengeluarannya tetap termasuk dalam total.
                  </p>
                )}
            </div>
            {monthlyError && (
              <QueryError
                retry={() => {
                  void budgets.refetch();
                  void summary.refetch();
                }}
              />
            )}
          </>
        )}
        {tab === "expenses" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="expense-filter" className="text-sm">
                Kategori
              </label>
              <select
                id="expense-filter"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="max-w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="">Semua kategori</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            {expenses.isPending ? (
              <Skeleton className="h-32 rounded-2xl" />
            ) : expenses.isError ? (
              <QueryError retry={() => void expenses.refetch()} />
            ) : expenses.data.length === 0 ? (
              <ContentState
                title={
                  category
                    ? "Belum ada pengeluaran di kategori ini"
                    : "Belum ada pengeluaran bulan ini"
                }
                description="Catat kebutuhan keluarga agar pengeluaran mudah dipantau."
                illustration={
                  <Wallet className="mx-auto h-9 w-9 text-primary-600" />
                }
                action={
                  <Button onClick={() => setExpenseDialog({})}>
                    Catat pengeluaran
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {expenses.data.map((expense) => (
                  <button
                    key={expense.id}
                    onClick={() => setExpenseDialog({ expense })}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-left hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {expense.category}
                      </p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {expense.description || "Tanpa catatan"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {format(
                          new Date(`${expense.date.slice(0, 10)}T12:00:00`),
                          "d MMM yyyy",
                          { locale },
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold">
                      {rupiah(expense.amount)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {tab === "budgets" &&
          (monthlyPending ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : (
            !monthlyError && (
              <BudgetProgress
                budgets={budgets.data ?? []}
                actuals={summary.data?.by_category ?? []}
                onEdit={(cat, _amount, id) =>
                  setBudgetDialog({
                    budget: id
                      ? budgets.data?.find((b) => b.id === id)
                      : undefined,
                    category: cat,
                  })
                }
              />
            )
          ))}
        {tab === "goals" &&
          (goals.isPending ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : goals.isError ? (
            <QueryError retry={() => void goals.refetch()} />
          ) : goals.data.length === 0 ? (
            <ContentState
              title="Mulai tabungan keluarga"
              description="Buat target dana darurat, pendidikan, atau liburan dan catat setiap setoran."
              action={
                <Button onClick={() => setGoalDialog({})}>
                  Tambah tabungan
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {goals.data.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={(g) => setGoalDialog({ goal: g })}
                  onDelete={(g) => setGoalDialog({ goal: g })}
                  onAddFund={setFundGoal}
                  onHistory={setHistoryGoal}
                />
              ))}
            </div>
          ))}
        {tab === "shopping" && (
          <>
            <p className="text-sm text-muted-foreground">
              Daftar belanja bersama tidak dibatasi bulan. Centang barang yang
              sudah dibeli, lalu selesaikan belanja untuk mencatat total sesuai
              struk.
            </p>
            <ShoppingList onCheckout={(items) => setExpenseDialog({ items })} />
          </>
        )}
      </section>
      {expenseDialog && (
        <ExpenseModal
          isOpen
          onClose={() => !expensePending && setExpenseDialog(null)}
          onSave={saveExpense}
          expense={expenseDialog.expense}
          isSaving={expensePending}
          isDeleting={deleteExpense.isPending}
          title={expenseDialog.items ? "Selesaikan belanja" : undefined}
          submitLabel={expenseDialog.items ? "Catat belanja" : undefined}
          onDelete={
            expenseDialog.expense
              ? async () => {
                  if (!window.confirm("Hapus pengeluaran ini?")) return;
                  try {
                    await deleteExpense.mutateAsync(expenseDialog.expense!.id);
                    setExpenseDialog(null);
                    toast.success("Pengeluaran dihapus");
                  } catch (error) {
                    reportError(error, "Gagal menghapus pengeluaran");
                  }
                }
              : undefined
          }
        />
      )}
      {budgetDialog && (
        <BudgetModal
          initialCategory={budgetDialog.category}
          budget={budgetDialog.budget}
          categories={categories}
          period={period}
          pending={upsertBudget.isPending || deleteBudget.isPending}
          onClose={() => setBudgetDialog(null)}
          onSave={saveBudget}
          onDelete={
            budgetDialog.budget
              ? async () => {
                  if (
                    !window.confirm(
                      "Hapus batas anggaran ini? Pengeluaran tetap tersimpan.",
                    )
                  )
                    return;
                  try {
                    await deleteBudget.mutateAsync(budgetDialog.budget!.id);
                    setBudgetDialog(null);
                    toast.success("Anggaran dihapus");
                  } catch (error) {
                    reportError(error, "Gagal menghapus anggaran");
                  }
                }
              : undefined
          }
        />
      )}
      {goalDialog && (
        <GoalModal
          isOpen
          goal={goalDialog.goal}
          onClose={() => setGoalDialog(null)}
          onSave={saveGoal}
          isSaving={createGoal.isPending || updateGoal.isPending}
          isDeleting={deleteGoal.isPending}
          onDelete={
            goalDialog.goal
              ? async () => {
                  if (
                    !window.confirm("Hapus tabungan beserta akses riwayatnya?")
                  )
                    return;
                  try {
                    await deleteGoal.mutateAsync(goalDialog.goal!.id);
                    setGoalDialog(null);
                    toast.success("Tabungan dihapus");
                  } catch (error) {
                    reportError(error, "Gagal menghapus tabungan");
                  }
                }
              : undefined
          }
        />
      )}
      <AddFundModal
        goal={fundGoal}
        onClose={() => !addFund.isPending && setFundGoal(null)}
        onConfirm={confirmFund}
        isSaving={addFund.isPending}
      />
      {historyGoal && (
        <GoalHistoryModal
          goal={goals.data?.find((g) => g.id === historyGoal.id) ?? historyGoal}
          onClose={() => setHistoryGoal(null)}
        />
      )}
    </div>
  );
}
