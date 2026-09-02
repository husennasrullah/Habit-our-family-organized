"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinancialGoal } from "@/types";

export interface GoalFormValues {
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

const DEFAULT: GoalFormValues = {
  title: "",
  target_amount: 0,
  current_amount: 0,
  deadline: "",
  notes: "",
};

export function GoalModal({
  isOpen, onClose, onSave, onDelete, goal, isSaving, isDeleting,
}: GoalModalProps) {
  const [form, setForm] = useState<GoalFormValues>(DEFAULT);

  useEffect(() => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-neutral-900">
            {goal ? "Edit Target" : "Tambah Target"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Nama Target <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="cth: Dana Darurat, Liburan Eropa"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              {...field("title")}
            />
          </div>

          {/* Target amount */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Nominal Target (Rp) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              {...field("target_amount")}
              onChange={(e) => setForm((v) => ({ ...v, target_amount: Number(e.target.value) }))}
            />
          </div>

          {/* Current amount */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Sudah Terkumpul (Rp)</label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              {...field("current_amount")}
              onChange={(e) => setForm((v) => ({ ...v, current_amount: Number(e.target.value) }))}
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Deadline (opsional)</label>
            <input
              type="date"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              {...field("deadline")}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Catatan (opsional)</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 resize-none"
              placeholder="Catatan singkat..."
              value={form.notes}
              onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center gap-2">
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
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button
              onClick={() => onSave(form)}
              disabled={isSaving || !form.title || form.target_amount <= 0}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
