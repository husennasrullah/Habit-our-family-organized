"use client";

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
  amount:      z.coerce.number().min(1, "Nominal harus lebih dari 0"),
  category:    z.string().min(1, "Kategori wajib dipilih"),
  description: z.string().optional(),
  date:        z.string().min(1, "Tanggal wajib diisi"),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  onSave:      (values: ExpenseFormValues) => void;
  onDelete?:   () => void;
  expense?:    Expense | null;
  isSaving?:   boolean;
  isDeleting?: boolean;
}

export function ExpenseModal({
  isOpen, onClose, onSave, onDelete, expense, isSaving, isDeleting,
}: ExpenseModalProps) {
  const isEditing = !!expense;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0, category: "", description: "",
      date: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (expense) {
      reset({
        amount:      expense.amount,
        category:    expense.category,
        description: expense.description ?? "",
        date:        expense.date.slice(0, 10),
      });
    } else {
      reset({ amount: 0, category: "", description: "", date: new Date().toISOString().slice(0, 10) });
    }
  }, [expense, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEditing ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="expense-form" onSubmit={handleSubmit(onSave)} className="px-5 py-4 space-y-4">
          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="exp-amount">Nominal (Rp) *</Label>
            <Input
              id="exp-amount"
              type="number"
              min={0}
              placeholder="0"
              {...register("amount")}
              className={cn(errors.amount && "border-error-500")}
            />
            {errors.amount && <p className="text-xs text-error-500">{errors.amount.message}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="exp-cat">Kategori *</Label>
            <select
              id="exp-cat"
              {...register("category")}
              className={cn(
                "w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20",
                errors.category ? "border-error-500" : "border-neutral-300"
              )}
            >
              <option value="">Pilih kategori...</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-error-500">{errors.category.message}</p>}
          </div>

          {/* Description + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="exp-desc">Keterangan</Label>
              <Input id="exp-desc" placeholder="Opsional" {...register("description")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="exp-date">Tanggal *</Label>
              <Input id="exp-date" type="date" {...register("date")} className={cn(errors.date && "border-error-500")} />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4">
          {isEditing && onDelete ? (
            <button type="button" onClick={onDelete} disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors disabled:opacity-50">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Hapus
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" form="expense-form" disabled={isSaving} className="bg-primary-500 hover:bg-primary-600">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {isEditing ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
