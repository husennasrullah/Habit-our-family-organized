"use client";

import { localDateKey } from "@/lib/dashboard";
import { ModalFrame } from "@/components/shared/ModalFrame";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types";

export const EXPENSE_CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Sekolah & Pendidikan",
  "Kesehatan",
  "Belanja Rumah",
  "Tagihan & Utilitas",
  "Hiburan",
  "Pakaian",
  "Tabungan & Investasi",
  "Lainnya",
];

const expenseSchema = z.object({
  amount: z.coerce
    .number()
    .finite()
    .positive("Nominal harus lebih dari 0")
    .max(9999999999999.99)
    .refine(
      (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.001,
      "Maksimal dua angka desimal",
    ),
  category: z.string().min(1, "Kategori wajib dipilih"),
  description: z.string().optional(),
  date: z.string().min(1, "Tanggal wajib diisi"),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: ExpenseFormValues) => void;
  onDelete?: () => void;
  expense?: Expense | null;
  isSaving?: boolean;
  isDeleting?: boolean;
  title?: string;
  submitLabel?: string;
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  expense,
  isSaving,
  isDeleting,
  title,
  submitLabel,
}: ExpenseModalProps) {
  const isEditing = !!expense;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      category: "",
      description: "",
      date: localDateKey(new Date()),
    },
  });

  useEffect(() => {
    if (expense) {
      reset({
        amount: expense.amount,
        category: expense.category,
        description: expense.description ?? "",
        date: expense.date.slice(0, 10),
      });
    } else {
      reset({
        amount: 0,
        category: "",
        description: "",
        date: localDateKey(new Date()),
      });
    }
  }, [expense, reset]);

  if (!isOpen) return null;

  return (
    <ModalFrame
      className="finance-dialog fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClose={onClose}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="finance-dialog-card relative z-10 max-h-[90dvh] overflow-y-auto w-full max-w-sm bg-card rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {title ?? (isEditing ? "Edit Pengeluaran" : "Tambah Pengeluaran")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          id="expense-form"
          onSubmit={handleSubmit(onSave)}
          className="px-4 py-3 space-y-3"
        >
          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="exp-amount">Nominal (Rp) *</Label>
            <Input
              id="exp-amount"
              type="number"
              step="0.01"
              min={0}
              placeholder="0"
              {...register("amount")}
              className={cn("h-9", errors.amount && "border-error-500")}
            />
            {errors.amount && (
              <p className="text-xs text-error-500">{errors.amount.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="exp-cat">Kategori *</Label>
            <select
              id="exp-cat"
              {...register("category")}
              className={cn(
                "w-full rounded-md border bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20",
                errors.category ? "border-error-500" : "border-neutral-300",
              )}
            >
              <option value="">Pilih kategori...</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-error-500">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Description + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="exp-desc">Keterangan</Label>
              <Input
                className="h-9"
                id="exp-desc"
                placeholder="Opsional"
                {...register("description")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="exp-date">Tanggal *</Label>
              <Input
                id="exp-date"
                type="date"
                {...register("date")}
                className={cn("h-9", errors.date && "border-error-500")}
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting || isSaving}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Hapus
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              form="expense-form"
              disabled={isSaving || isDeleting}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {submitLabel ?? (isEditing ? "Simpan" : "Tambah")}
            </Button>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}
