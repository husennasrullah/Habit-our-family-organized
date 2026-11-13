"use client";
import { useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useAddTripExpense,
  useUpdateTripExpense,
  useDeleteTripExpense,
  useToggleExpenseSplit,
} from "@/hooks/useTrips";
import { ModalFrame } from "@/components/shared/ModalFrame";
import { Button } from "@/components/ui/button";
import { localDateKey } from "@/lib/dashboard";
import { rupiah } from "@/lib/finance";
import { equalShares, settlementRows } from "@/lib/trips";
import type { Trip, TripExpense, CreateTripExpensePayload } from "@/types";
const money = z
  .number()
  .finite()
  .max(9999999999999.99)
  .refine(
    (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.001,
    "Nominal maksimal dua angka desimal",
  );
const schema = z.object({
  title: z.string().trim().min(1, "Nama pengeluaran wajib diisi"),
  amount: money.refine((n) => n > 0, "Nominal harus lebih dari nol"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Isi tanggal transaksi"),
  category: z.string().min(1),
  notes: z.string(),
  paid_by: z.string().nullable(),
  split_type: z.enum(["none", "all", "custom"]),
  splits: z
    .array(
      z.object({
        member_id: z.string(),
        amount: money.refine((n) => n >= 0, "Bagian tidak boleh negatif"),
      }),
    )
    .optional(),
});
function message(error: unknown) {
  return isAxiosError(error) &&
    typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : "Perubahan belum berhasil disimpan. Coba lagi.";
}
export function TripExpensesPanel({ trip }: { trip: Trip }) {
  const create = useAddTripExpense(trip.id),
    update = useUpdateTripExpense(trip.id),
    remove = useDeleteTripExpense(trip.id),
    toggle = useToggleExpenseSplit(trip.id);
  const [dialog, setDialog] = useState<{ expense?: TripExpense } | null>(null);
  const unsettled = settlementRows(trip.expenses ?? []);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {trip.expenses?.length ?? 0} pengeluaran · {unsettled.length} bagian
          belum lunas
        </p>
        <Button onClick={() => setDialog({})}>
          <Plus size={15} />
          Tambah pengeluaran
        </Button>
      </div>
      {(trip.expenses ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center">
          <h2 className="text-sm font-semibold">
            Catat pengeluaran perjalanan
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Biaya bisa dicatat tanpa pembagian, dibagi rata, atau dibagi sesuai
            nominal anggota.
          </p>
        </div>
      ) : (
        (trip.expenses ?? []).map((expense) => (
          <article
            key={expense.id}
            className="min-w-0 space-y-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="break-words text-sm font-semibold">
                  {expense.title}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {expense.date.slice(0, 10)} · {expense.category} ·{" "}
                  {expense.payer
                    ? `Dibayar ${expense.payer.name}`
                    : "Pembayar belum diisi"}
                </p>
              </div>
              <div className="flex max-w-full flex-wrap items-center gap-1">
                <strong className="max-w-full break-words text-sm tabular-nums">
                  {rupiah(expense.amount)}
                </strong>
                <button
                  onClick={() => setDialog({ expense })}
                  aria-label={`Edit pengeluaran ${expense.title}`}
                  className="rounded-lg p-2 hover:bg-muted"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Hapus pengeluaran beserta pembagiannya?"))
                      return;
                    try {
                      await remove.mutateAsync(expense.id);
                      toast.success("Pengeluaran dihapus");
                    } catch (e) {
                      toast.error(message(e));
                    }
                  }}
                  disabled={remove.isPending}
                  aria-label={`Hapus pengeluaran ${expense.title}`}
                  className="rounded-lg p-2 hover:bg-muted"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {expense.notes && (
              <p className="break-words text-xs text-muted-foreground">
                {expense.notes}
              </p>
            )}
            {expense.split_type === "none" ? (
              <p className="text-xs text-muted-foreground">
                Tanpa pembagian biaya
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border px-3">
                {(expense.splits ?? []).map((split) => {
                  const payer = split.member_id === expense.paid_by;
                  return (
                    <li
                      key={split.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <div className="min-w-0">
                        <p className="break-words text-xs font-medium">
                          {split.member?.name ?? "Anggota perjalanan"}
                          {payer ? " · pembayar" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rupiah(split.amount)}
                        </p>
                      </div>
                      {payer || split.amount === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Tidak perlu pelunasan
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await toggle.mutateAsync({
                                expenseId: expense.id,
                                splitId: split.id,
                              });
                              toast.success(
                                split.is_settled
                                  ? "Status kembali belum lunas"
                                  : "Pelunasan dicatat",
                              );
                            } catch (e) {
                              toast.error(message(e));
                            }
                          }}
                          disabled={toggle.isPending}
                          aria-pressed={split.is_settled}
                          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                        >
                          {split.is_settled
                            ? "Lunas · batalkan"
                            : "Tandai lunas"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        ))
      )}
      {dialog && (
        <ExpenseDialog
          key={dialog.expense?.id ?? "new"}
          trip={trip}
          expense={dialog.expense}
          pending={create.isPending || update.isPending}
          onClose={() => setDialog(null)}
          onSave={async (payload) => {
            try {
              if (dialog.expense)
                await update.mutateAsync({
                  expenseId: dialog.expense.id,
                  payload,
                });
              else await create.mutateAsync(payload);
              setDialog(null);
              toast.success("Pengeluaran disimpan");
            } catch (e) {
              toast.error(message(e));
            }
          }}
        />
      )}
    </div>
  );
}
function ExpenseDialog({
  trip,
  expense,
  pending,
  onClose,
  onSave,
}: {
  trip: Trip;
  expense?: TripExpense;
  pending: boolean;
  onClose: () => void;
  onSave: (p: CreateTripExpensePayload) => void;
}) {
  const [form, setForm] = useState({
    title: expense?.title ?? "",
    amount: expense?.amount ?? 0,
    category: expense?.category ?? "Kuliner",
    date: expense?.date.slice(0, 10) ?? localDateKey(new Date()),
    paid_by: expense?.paid_by ?? "",
    notes: expense?.notes ?? "",
    split_type: expense?.split_type ?? "none",
  });
  const [custom, setCustom] = useState<Record<string, number>>(
      Object.fromEntries(
        (expense?.splits ?? []).map((s) => [s.member_id, s.amount]),
      ),
    ),
    [error, setError] = useState("");
  const shares =
    form.split_type === "all"
      ? equalShares(
          form.amount,
          (trip.members ?? []).map((m) => m.id),
        )
      : (trip.members ?? []).map((m) => ({
          member_id: m.id,
          amount: custom[m.id] ?? 0,
        }));
  const field = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((v) => ({
        ...v,
        [name]: name === "amount" ? Number(e.target.value) : e.target.value,
      })),
  });
  return (
    <ModalFrame
      onClose={() => !pending && onClose()}
      className="trip-dialog fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <form
        className="trip-dialog-card w-full space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = schema.safeParse({
            ...form,
            paid_by: form.paid_by || null,
            splits: form.split_type === "custom" ? shares : undefined,
          });
          if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            return;
          }
          if (
            form.split_type !== "none" &&
            (!form.paid_by || !trip.members?.length)
          ) {
            setError(
              "Pilih pembayar dan tambahkan anggota perjalanan untuk membagi biaya",
            );
            return;
          }
          if (
            form.split_type === "custom" &&
            Math.round(shares.reduce((s, p) => s + p.amount, 0) * 100) !==
              Math.round(form.amount * 100)
          ) {
            setError("Jumlah bagian harus sama dengan total pengeluaran");
            return;
          }
          setError("");
          onSave(parsed.data);
        }}
      >
        <h2 className="text-base font-semibold">
          {expense ? "Edit pengeluaran" : "Tambah pengeluaran"}
        </h2>
        <div>
          <label htmlFor="trip-expense-title" className="mb-1 block text-xs">
            Nama pengeluaran
          </label>
          <input
            id="trip-expense-title"
            required
            {...field("title")}
            className="w-full rounded-xl border border-border px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="trip-expense-amount" className="mb-1 block text-xs">
              Nominal (Rp)
            </label>
            <input
              id="trip-expense-amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              {...field("amount")}
              className="w-full rounded-xl border border-border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="trip-expense-date" className="mb-1 block text-xs">
              Tanggal transaksi
            </label>
            <input
              id="trip-expense-date"
              type="date"
              required
              {...field("date")}
              className="w-full rounded-xl border border-border px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="trip-expense-category"
              className="mb-1 block text-xs"
            >
              Kategori
            </label>
            <select
              id="trip-expense-category"
              {...field("category")}
              className="w-full rounded-xl border border-border px-3 py-2"
            >
              {[
                "Kuliner",
                "Transportasi",
                "Penginapan",
                "Tiket/Wisata",
                "Belanja/Oleh-oleh",
                "Lain-lain",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="trip-expense-payer" className="mb-1 block text-xs">
              Dibayar oleh
            </label>
            <select
              id="trip-expense-payer"
              {...field("paid_by")}
              className="w-full rounded-xl border border-border px-3 py-2"
            >
              <option value="">Belum diisi</option>
              {(trip.members ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="trip-expense-split" className="mb-1 block text-xs">
            Pembagian biaya
          </label>
          <select
            id="trip-expense-split"
            {...field("split_type")}
            className="w-full rounded-xl border border-border px-3 py-2"
          >
            <option value="none">Tanpa pembagian</option>
            <option value="all">Bagi rata semua anggota</option>
            <option value="custom">Nominal per anggota</option>
          </select>
        </div>
        {form.split_type !== "none" && (
          <div className="space-y-2 rounded-xl bg-muted p-3">
            {(trip.members ?? []).map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,120px)] items-center gap-2"
              >
                <label
                  htmlFor={`share-${m.id}`}
                  className="break-words text-xs"
                >
                  {m.name}
                </label>
                {form.split_type === "custom" ? (
                  <input
                    id={`share-${m.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={custom[m.id] ?? 0}
                    onChange={(e) =>
                      setCustom((v) => ({
                        ...v,
                        [m.id]: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-border px-2 py-1"
                  />
                ) : (
                  <span className="break-words text-right text-xs">
                    {rupiah(
                      shares.find((s) => s.member_id === m.id)?.amount ?? 0,
                    )}
                  </span>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Bagian pembayar otomatis lunas. Pembagian baru pada edit biaya
              akan menghitung ulang status pelunasan.
            </p>
          </div>
        )}
        <div>
          <label htmlFor="trip-expense-notes" className="mb-1 block text-xs">
            Catatan
          </label>
          <input
            id="trip-expense-notes"
            {...field("notes")}
            className="w-full rounded-xl border border-border px-3 py-2"
          />
        </div>
        {error && (
          <p role="alert" className="text-xs text-red-700 dark:text-red-200">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan pengeluaran"}
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}
