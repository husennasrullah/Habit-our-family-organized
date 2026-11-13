import type { Budget, CategorySummary } from "@/types";

export function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
export function financeOverview(budgets: Budget[], actuals: CategorySummary[]) {
  const allocated = budgets.reduce((sum, b) => sum + b.amount, 0);
  const spent = actuals.reduce((sum, a) => sum + a.total, 0);
  const unallocated = actuals.filter(
    (a) => !budgets.some((b) => b.category === a.category && b.amount > 0),
  );
  return {
    allocated,
    spent,
    remaining: Math.round((allocated - spent) * 100) / 100,
    unallocated,
  };
}
