"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalFrame } from "@/components/shared/ModalFrame";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORIES } from "./ExpenseModal";
import type { Budget } from "@/types";

const schema = z.object({
  category: z.string().trim().min(1, "Pilih kategori"),
  amount: z.coerce
    .number()
    .finite()
    .positive("Anggaran harus lebih dari nol")
    .max(9999999999999.99)
    .refine(
      (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.001,
      "Maksimal dua angka desimal",
    ),
});
export type BudgetValues = z.infer<typeof schema>;
export function BudgetModal({
  budget,
  initialCategory,
  categories,
  period,
  onSave,
  onDelete,
  onClose,
  pending,
}: {
  budget?: Budget;
  initialCategory?: string;
  categories: string[];
  period: string;
  onSave: (v: BudgetValues) => void;
  onDelete?: () => void;
  onClose: () => void;
  pending: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: budget?.category ?? initialCategory ?? "",
      amount: budget?.amount ?? 0,
    },
  });
  const options = Array.from(new Set([...EXPENSE_CATEGORIES, ...categories]));
  return (
    <ModalFrame
      onClose={onClose}
      className="finance-dialog fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit(onSave)}
        className="finance-dialog-card relative max-h-[90dvh] overflow-y-auto w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xl"
      >
        <div>
          <h2 className="text-base font-semibold">
            {budget ? "Edit anggaran" : "Buat anggaran"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {period} · batas pengeluaran per kategori
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="budget-category">
            Kategori
          </label>
          {budget ? (
            <input
              id="budget-category"
              {...register("category")}
              readOnly
              className="w-full rounded-xl border border-border bg-muted px-3 py-2"
            />
          ) : (
            <select
              id="budget-category"
              {...register("category")}
              className="w-full rounded-xl border border-border px-3 py-2"
              aria-invalid={!!errors.category}
              aria-describedby={
                errors.category ? "budget-category-error" : undefined
              }
            >
              <option value="">Pilih kategori</option>
              {options.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
          {errors.category && (
            <p
              id="budget-category-error"
              className="text-xs text-red-700 dark:text-red-200"
            >
              {errors.category.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="budget-amount">
            Anggaran (Rp)
          </label>
          <input
            id="budget-amount"
            type="number"
            min="0.01"
            step="0.01"
            {...register("amount")}
            className="w-full rounded-xl border border-border px-3 py-2"
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? "budget-amount-error" : undefined}
          />
          {errors.amount && (
            <p
              id="budget-amount-error"
              className="text-xs text-red-700 dark:text-red-200"
            >
              {errors.amount.message}
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={pending}
            >
              Hapus anggaran
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan anggaran"}
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}
