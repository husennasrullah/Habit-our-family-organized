"use client";

import { ModalFrame } from "@/components/shared/ModalFrame";

import { useState, useEffect } from "react";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinancialGoal } from "@/types";

export interface GoalFormValues {
  adjust_balance?: boolean;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  notes: string;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: GoalFormValues) => void;
  onDelete?: () => void;
  goal?: FinancialGoal | null;
  isSaving?: boolean;
  isDeleting?: boolean;
}

const money = z
  .number()
  .finite()
  .max(9999999999999.99)
  .refine(
    (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.001,
    "Maksimal dua angka desimal",
  );
const goalSchema = z.object({
  title: z.string().trim().min(1, "Nama tabungan wajib diisi"),
  target_amount: money.refine((n) => n > 0, "Target harus lebih dari nol"),
  current_amount: money.refine((n) => n >= 0, "Saldo tidak boleh negatif"),
  deadline: z.string(),
  notes: z.string(),
  adjust_balance: z.boolean().optional(),
});

const DEFAULT: GoalFormValues = {
  title: "",
  target_amount: 0,
  current_amount: 0,
  deadline: "",
  notes: "",
};

export function GoalModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  goal,
  isSaving,
  isDeleting,
}: GoalModalProps) {
  const [formError, setFormError] = useState("");
  const [adjustBalance, setAdjustBalance] = useState(false);
  const [form, setForm] = useState<GoalFormValues>(DEFAULT);

  useEffect(() => {
    setAdjustBalance(false);
    setFormError("");
    if (goal) {
      setForm({
        title: goal.title,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        deadline: goal.deadline ?? "",
        notes: goal.notes,
      });
    } else {
      setForm(DEFAULT);
    }
  }, [goal, isOpen]);

  if (!isOpen) return null;

  const field = (key: keyof GoalFormValues) => ({
    value: form[key] as string | number,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <ModalFrame
      className="finance-dialog fixed inset-0 z-50 flex items-center justify-center p-4"
      onClose={onClose}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="finance-dialog-card relative z-10 max-h-[90dvh] overflow-y-auto w-full max-w-sm rounded-2xl bg-card p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">
            {goal ? "Edit tabungan" : "Tambah tabungan"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Title */}
          <div className="col-span-2">
            <label
              className="block text-xs font-medium text-foreground mb-1"
              htmlFor="field-GoalModal-componentsbudget-0"
            >
              Nama Target <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="cth: Dana Darurat, Liburan Eropa"
              className="w-full rounded-lg border border-neutral-300 bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              {...field("title")}
              id="field-GoalModal-componentsbudget-0"
            />
          </div>

          {goal && (
            <label className="col-span-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={adjustBalance}
                onChange={(e) => setAdjustBalance(e.target.checked)}
              />
              Koreksi saldo secara manual
            </label>
          )}
          {/* Target amount */}
          <div>
            <label
              className="block text-xs font-medium text-foreground mb-1"
              htmlFor="field-GoalModal-componentsbudget-1"
            >
              Nominal Target (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              className="w-full rounded-lg border border-neutral-300 bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              {...field("target_amount")}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  target_amount: Number(e.target.value),
                }))
              }
              id="field-GoalModal-componentsbudget-1"
            />
          </div>

          {/* Current amount */}
          <div>
            <label
              className="block text-xs font-medium text-foreground mb-1"
              htmlFor="field-GoalModal-componentsbudget-2"
            >
              Sudah Terkumpul (Rp)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              className="w-full rounded-lg border border-neutral-300 bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              {...field("current_amount")}
              disabled={!!goal && !adjustBalance}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  current_amount: Number(e.target.value),
                }))
              }
              id="field-GoalModal-componentsbudget-2"
            />
          </div>

          {/* Deadline */}
          <div className="col-span-2">
            <label
              className="block text-xs font-medium text-foreground mb-1"
              htmlFor="field-GoalModal-componentsbudget-3"
            >
              Deadline (opsional)
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-neutral-300 bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              {...field("deadline")}
              id="field-GoalModal-componentsbudget-3"
            />
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <label
              className="block text-xs font-medium text-foreground mb-1"
              htmlFor="field-GoalModal-componentsbudget-4"
            >
              Catatan (opsional)
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-neutral-300 bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 resize-none"
              placeholder="Catatan singkat..."
              value={form.notes}
              onChange={(e) =>
                setForm((v) => ({ ...v, notes: e.target.value }))
              }
              id="field-GoalModal-componentsbudget-4"
            />
          </div>
        </div>

        {formError && (
          <p
            role="alert"
            className="mt-3 text-xs text-red-700 dark:text-red-200"
          >
            {formError}
          </p>
        )}
        {/* Footer */}
        <div className="mt-3 flex items-center gap-2">
          {onDelete && (
            <Button
              variant="outline"
              className="text-red-500 border-red-200 hover:bg-red-50"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              onClick={() => {
                const parsed = goalSchema.safeParse({
                  ...form,
                  title: form.title.trim(),
                  adjust_balance: adjustBalance,
                });
                if (!parsed.success) {
                  setFormError(parsed.error.issues[0].message);
                  return;
                }
                setFormError("");
                onSave(parsed.data);
              }}
              disabled={
                isSaving ||
                !form.title.trim() ||
                !Number.isFinite(form.target_amount) ||
                form.target_amount <= 0 ||
                !Number.isFinite(form.current_amount) ||
                form.current_amount < 0
              }
              className="bg-primary-500 hover:bg-primary-600"
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}
