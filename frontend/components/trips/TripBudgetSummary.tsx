import { tripOverview } from "@/lib/trips";
import { rupiah } from "@/lib/finance";
import type { Trip } from "@/types";
export function TripBudgetSummary({ trip }: { trip: Trip }) {
  const { budget, estimate, spent, remaining } = tripOverview(trip);
  return (
    <div
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      aria-label="Ringkasan biaya liburan"
    >
      {[
        ["Batas anggaran", budget > 0 ? rupiah(budget) : "Belum diatur"],
        ["Estimasi kegiatan", estimate > 0 ? rupiah(estimate) : "Belum diisi"],
        ["Pengeluaran aktual", rupiah(spent)],
        [
          remaining !== null && remaining < 0
            ? "Melebihi anggaran"
            : "Sisa anggaran",
          remaining === null ? "Belum diatur" : rupiah(Math.abs(remaining)),
        ],
      ].map(([label, value]) => (
        <div
          key={label}
          className="min-w-0 rounded-xl border border-border bg-card p-3"
        >
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 break-words text-sm font-bold tabular-nums">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
