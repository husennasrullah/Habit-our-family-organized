"use client";

import { ModalFrame } from "@/components/shared/ModalFrame";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinancialGoal } from "@/types";

interface AddFundModalProps {
  goal: FinancialGoal | null;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  isSaving?: boolean;
}

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function AddFundModal({
  goal,
  onClose,
  onConfirm,
  isSaving,
}: AddFundModalProps) {
  const [amount, setAmount] = useState<number>(0);

  if (!goal) return null;

  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);

  return (
    <ModalFrame
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClose={onClose}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xs rounded-2xl bg-card p-6 shadow-xl">
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
          min={1}
          autoFocus
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded-lg border border-neutral-300 bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 mb-4"
          placeholder="Masukkan nominal..."
          id="field-AddFundModal-componentsbudget-0"
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={() => onConfirm(amount)}
            disabled={isSaving || amount <= 0}
            className="bg-primary-500 hover:bg-primary-600"
          >
            {isSaving ? "Menyimpan..." : "Tambahkan"}
          </Button>
        </div>
      </div>
    </ModalFrame>
  );
}
