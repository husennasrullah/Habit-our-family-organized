"use client";

import { cn } from "@/lib/utils";
import type { Budget, CategorySummary } from "@/types";

interface BudgetProgressProps {
  budgets: Budget[];
  actuals: CategorySummary[];
  onEdit: (category: string, currentAmount: number, budgetId?: string) => void;
}

function formatRp(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function BudgetProgress({
  budgets,
  actuals,
  onEdit,
}: BudgetProgressProps) {
  if (budgets.length === 0 && actuals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Belum ada data budget bulan ini
        </p>
      </div>
    );
  }

  // Merge categories from both budgets and actuals
  const allCategories = Array.from(
    new Set([
      ...budgets.map((b) => b.category),
      ...actuals.map((a) => a.category),
    ]),
  );

  return (
    <div className="space-y-3">
      {allCategories.map((cat) => {
        const budget = budgets.find((b) => b.category === cat);
        const actual = actuals.find((a) => a.category === cat);
        const budgetAmt = budget?.amount ?? 0;
        const actualAmt = actual?.total ?? 0;
        const pct =
          budgetAmt > 0 ? Math.min((actualAmt / budgetAmt) * 100, 100) : 0;
        const isOver = budgetAmt > 0 && actualAmt > budgetAmt;

        return (
          <div
            key={cat}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {cat}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRp(actualAmt)}
                  {budgetAmt > 0 && (
                    <span
                      className={cn(
                        "ml-1",
                        isOver
                          ? "text-error-600 font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      / {formatRp(budgetAmt)}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => onEdit(cat, budgetAmt, budget?.id)}
                className="flex-shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
              >
                {budget ? "Edit" : "Set target"}
              </button>
            </div>

            {budgetAmt <= 0 && (
              <p className="text-xs text-muted-foreground">
                Anggaran belum diatur
              </p>
            )}
            {budgetAmt > 0 && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    isOver
                      ? "bg-error-500"
                      : pct > 80
                        ? "bg-warning-500"
                        : "bg-primary-400",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
            {isOver && (
              <p className="mt-2 text-xs text-red-700 dark:text-red-200">
                Melebihi anggaran {formatRp(actualAmt - budgetAmt)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
