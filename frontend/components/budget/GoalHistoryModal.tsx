"use client";
import { useGoalEntries } from "@/hooks/useFinancialGoals";
import { ModalFrame } from "@/components/shared/ModalFrame";
import { QueryError } from "@/components/shared/QueryError";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/finance";
import type { FinancialGoal } from "@/types";
export function GoalHistoryModal({
  goal,
  onClose,
}: {
  goal: FinancialGoal;
  onClose: () => void;
}) {
  const query = useGoalEntries(goal.id);
  return (
    <ModalFrame
      onClose={onClose}
      className="finance-dialog fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <section className="finance-dialog-card finance-dialog-history relative max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Riwayat setoran</h2>
            <p className="text-sm text-muted-foreground">{goal.title}</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
        <p className="mb-4 rounded-xl bg-muted p-3 text-sm">
          Saldo tercatat: <strong>{rupiah(goal.current_amount)}</strong>
        </p>
        {query.isPending ? (
          <p role="status" className="text-sm">
            Memuat riwayat…
          </p>
        ) : query.isError ? (
          <QueryError retry={() => void query.refetch()} />
        ) : query.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada riwayat setoran.
            {goal.current_amount > 0
              ? " Saldo lama tetap tersimpan; rincian setoran sebelum fitur riwayat tidak tersedia."
              : " Mulai dengan menambahkan dana."}
          </p>
        ) : (
          <ol className="space-y-3">
            {query.data.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-border p-3"
              >
                <div className="flex justify-between gap-2 text-sm">
                  <strong>
                    {entry.kind === "deposit"
                      ? "Setoran"
                      : entry.kind === "adjustment"
                        ? "Koreksi saldo"
                        : "Saldo awal"}
                  </strong>
                  <strong>
                    {entry.amount > 0 ? "+" : ""}
                    {rupiah(entry.amount)}
                  </strong>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.actor_name ||
                    (entry.actor_id
                      ? "Anggota keluarga"
                      : "Pencatatan saldo lama")}{" "}
                  ·{" "}
                  {new Date(entry.created_at).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {entry.note && <p className="mt-1 text-xs">{entry.note}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  Saldo setelahnya: {rupiah(entry.balance_after)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </ModalFrame>
  );
}
