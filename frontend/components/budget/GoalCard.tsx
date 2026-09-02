"use client";

import { format, parseISO } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import { CheckCircle2, Pencil, Trash2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialGoal } from "@/types";

interface GoalCardProps {
  goal: FinancialGoal;
  onEdit: (g: FinancialGoal) => void;
  onDelete: (g: FinancialGoal) => void;
  onAddFund: (g: FinancialGoal) => void;
}

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}

export function GoalCard({ goal, onEdit, onDelete, onAddFund }: GoalCardProps) {
  const pct = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;

  return (
    <div className={cn(
      "group relative rounded-2xl border bg-white p-4 transition-shadow hover:shadow-md",
      goal.is_achieved ? "border-emerald-200 bg-emerald-50/40" : "border-neutral-200"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {goal.is_achieved && (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
            )}
            <p className={cn(
              "text-sm font-semibold truncate",
              goal.is_achieved ? "text-emerald-700" : "text-neutral-900"
            )}>
              {goal.title}
            </p>
          </div>
          {goal.deadline && (
            <p className="mt-0.5 text-xs text-neutral-400">
              Deadline: {format(parseISO(goal.deadline), "d MMM yyyy", { locale: dateLocale })}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(goal)}
            className="rounded-full bg-neutral-100 p-1.5 text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(goal)}
            className="rounded-full bg-neutral-100 p-1.5 text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-neutral-500 mb-1">
          <span>{formatRp(goal.current_amount)}</span>
          <span>{formatRp(goal.target_amount)}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              goal.is_achieved ? "bg-emerald-500" : "bg-primary-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={cn(
          "mt-1 text-right text-xs font-medium",
          goal.is_achieved ? "text-emerald-600" : "text-neutral-500"
        )}>
          {goal.is_achieved ? "Tercapai ✓" : `${Math.round(pct)}%`}
        </p>
      </div>

      {/* Notes */}
      {goal.notes && (
        <p className="mb-3 text-xs text-neutral-400 line-clamp-2">{goal.notes}</p>
      )}

      {/* Tambah Dana button */}
      {!goal.is_achieved && (
        <button
          onClick={() => onAddFund(goal)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-100 transition-colors"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Tambah Dana
        </button>
      )}
    </div>
  );
}
