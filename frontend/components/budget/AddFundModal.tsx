"use client";

import { ModalFrame } from "@/components/shared/ModalFrame";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rupiah as formatRp } from "@/lib/finance";
import type { FinancialGoal } from "@/types";

interface AddFundModalProps {
  goal: FinancialGoal | null;
  onClose: () => void;
  onConfirm: (amount: number, note: string) => void;
  isSaving?: boolean;
}

export function AddFundModal({
  goal,
  onClose,
  onConfirm,
  isSaving,
}: AddFundModalProps) {
  const [amount, setAmount] = useState<number>(0);

  const [note, setNote] = useState("");
  useEffect(() => {
    setAmount(0);
    setNote("");
  }, [goal?.id]);
  if (!goal) return null;

  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);

  return (
    <ModalFrame
      className="finance-dialog fixed inset-0 z-50 flex items-center justify-center p-4"
      onClose={onClose}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="finance-dialog-card relative z-10 max-h-[90dvh] overflow-y-auto w-full max-w-xs rounded-2xl bg-card p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Tambah Dana</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-1 text-xs text-muted-foreground truncate">
          Target:{" "}
          <span className="font-medium text-foreground">{goal.title}</span>
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Sisa:{" "}
          <span className="font-medium text-primary-600">
            {formatRp(remaining)}
          </span>
        </p>

        <label
          className="block text-xs font-medium text-foreground mb-1"
          htmlFor="field-AddFundModal-componentsbudget-0"
        >
          Nominal yang ditambahkan (Rp)
        </label>
        <input
          type="number"
          step="0.01"
          min={1}
          autoFocus
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded-lg border border-neutral-300 bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 mb-4"
          placeholder="Masukkan nominal..."
          id="field-AddFundModal-componentsbudget-0"
        />

        <label className="mb-1 block text-xs" htmlFor="deposit-note">
          Catatan setoran (opsional)
        </label>
        <input
          id="deposit-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={() => onConfirm(amount, note)}
            disabled={isSaving || !Number.isFinite(amount) || amount <= 0}
            className="bg-primary-500 hover:bg-primary-600"
          >
            {isSaving ? "Menyimpan..." : "Tambahkan"}
          </Button>
        </div>
      </div>
    </ModalFrame>
  );
}
