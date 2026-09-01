"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, ExternalLink, Pencil, Trash2, Bell, X, UtensilsCrossed } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useMealPlans,
  useCreateMealPlan,
  useUpdateMealPlan,
  useDeleteMealPlan,
} from "@/hooks/useMealPlans";
import type { MealPlan, MealType } from "@/types";

// ─── Konstanta ────────────────────────────────────────────────────────────────

const MEAL_TYPES: { value: MealType; label: string; emoji: string; time: string }[] = [
  { value: "breakfast", label: "Sarapan",     emoji: "🌅", time: "06:00–09:00" },
  { value: "lunch",     label: "Makan Siang", emoji: "☀️", time: "11:00–13:00" },
  { value: "dinner",    label: "Makan Malam", emoji: "🌙", time: "18:00–20:00" },
];

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function toDateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function getMealsForSlot(meals: MealPlan[], date: Date, mealType: MealType): MealPlan[] {
  return meals.filter((m) => m.date.slice(0, 10) === toDateStr(date) && m.meal_type === mealType);
}

// ─── Sub-komponen ─────────────────────────────────────────────────────────────

function MealSlotCard({
  meal,
  onDetail,
}: {
  meal: MealPlan;
  onDetail: (m: MealPlan) => void;
}) {
  return (
    <button
      onClick={() => onDetail(meal)}
      className="group w-full text-left rounded-lg border border-neutral-100 dark:border-primary-900 bg-primary-50 dark:bg-primary-950 p-2.5 hover:bg-primary-100 dark:hover:bg-primary-900 hover:border-primary-200 transition-colors"
    >
      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 leading-snug line-clamp-2">{meal.name}</p>
      {meal.notes && (
        <p className="mt-0.5 text-[11px] text-neutral-500 line-clamp-1">{meal.notes}</p>
      )}
      {meal.recipe_url && (
        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-primary-600">
          <ExternalLink className="h-3 w-3" /> Resep
        </span>
      )}
    </button>
  );
}

// ─── Modal Detail ─────────────────────────────────────────────────────────────

function MealDetailModal({
  meal,
  onClose,
  onEdit,
  onDelete,
  isDeleting,
}: {
  meal: MealPlan | null;
  onClose: () => void;
  onEdit: (m: MealPlan) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  if (!meal) return null;

  const mealMeta = MEAL_TYPES.find((m) => m.value === meal.meal_type);
  const dateLabel = format(new Date(meal.date.slice(0, 10) + "T00:00:00"), "EEEE, d MMMM yyyy", { locale: dateLocale });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40">
      <div className="bg-white dark:bg-neutral-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{mealMeta?.emoji}</span>
            <div>
              <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{mealMeta?.label} · {mealMeta?.time}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{dateLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Menu</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{meal.name}</p>
          </div>

          {meal.notes && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Catatan</p>
              <p className="text-sm text-neutral-700">{meal.notes}</p>
            </div>
          )}

          {meal.recipe_url && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Link Resep</p>
              <a
                href={meal.recipe_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {meal.recipe_url}
              </a>
            </div>
          )}

          {!meal.notes && !meal.recipe_url && (
            <div className="flex flex-col items-center justify-center py-4 text-neutral-300">
              <UtensilsCrossed className="h-8 w-8 mb-2" />
              <p className="text-xs">Tidak ada catatan tambahan</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={() => onDelete(meal.id)}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </button>
          <button
            onClick={() => onEdit(meal)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function AddSlotButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-dashed border-neutral-200 py-1.5 flex items-center justify-center text-neutral-300 hover:border-primary-300 hover:text-primary-400 transition-colors"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  );
}

// ─── Modal Form ───────────────────────────────────────────────────────────────

function MealFormModal({
  isOpen,
  onClose,
  onSave,
  mealType,
  date,
  editingMeal,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: { name: string; notes: string; recipe_url: string }) => void;
  mealType: MealType;
  date: Date;
  editingMeal?: MealPlan;
  isSaving: boolean;
}) {
  const [name, setName]           = useState("");
  const [notes, setNotes]         = useState("");
  const [recipeURL, setRecipeURL] = useState("");

  // Sync state setiap kali modal dibuka atau editingMeal berganti
  useEffect(() => {
    if (isOpen) {
      setName(editingMeal?.name ?? "");
      setNotes(editingMeal?.notes ?? "");
      setRecipeURL(editingMeal?.recipe_url ?? "");
    }
  }, [isOpen, editingMeal]);

  if (!isOpen) return null;

  const mealLabel = MEAL_TYPES.find((m) => m.value === mealType)?.label ?? "";
  const dateLabel = format(date, "EEEE, d MMMM yyyy", { locale: dateLocale });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
            {editingMeal ? "Edit" : "Tambah"} {mealLabel}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">{dateLabel}</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Nama Masakan *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
              placeholder="contoh: Nasi Goreng Spesial"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Catatan Singkat</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
              placeholder="bahan khusus, porsi, dll."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Link Resep (opsional)</label>
            <input
              value={recipeURL}
              onChange={(e) => setRecipeURL(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
              placeholder="https://..."
              type="url"
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800">
            Batal
          </button>
          <button
            onClick={() => onSave({ name, notes, recipe_url: recipeURL })}
            disabled={!name.trim() || isSaving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MealsPage() {
  const today     = new Date();
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(today, { weekStartsOn: 1 }) // Mulai Senin
  );

  const [modalOpen, setModalOpen]           = useState(false);
  const [detailMeal, setDetailMeal]         = useState<MealPlan | null>(null);
  const [selectedDate, setSelectedDate]     = useState<Date>(today);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");
  const [editingMeal, setEditingMeal]       = useState<MealPlan | undefined>();

  const weekDays = getWeekDays(weekStart);
  const from = toDateStr(weekDays[0]);
  const to   = toDateStr(weekDays[6]);

  const { data: meals = [], isLoading } = useMealPlans(from, to);
  const createMeal = useCreateMealPlan();
  const updateMeal = useUpdateMealPlan();
  const deleteMeal = useDeleteMealPlan();

  const openAdd = useCallback((date: Date, mealType: MealType) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setEditingMeal(undefined);
    setModalOpen(true);
  }, []);

  const openDetail = useCallback((meal: MealPlan) => {
    setDetailMeal(meal);
  }, []);

  const openEdit = useCallback((meal: MealPlan) => {
    setDetailMeal(null);
    setSelectedDate(new Date(meal.date.slice(0, 10) + "T00:00:00"));
    setSelectedMealType(meal.meal_type);
    setEditingMeal(meal);
    setModalOpen(true);
  }, []);

  const handleSave = async (values: { name: string; notes: string; recipe_url: string }) => {
    try {
      if (editingMeal) {
        await updateMeal.mutateAsync({ id: editingMeal.id, ...values });
        toast.success("Menu diperbarui");
      } else {
        await createMeal.mutateAsync({
          date: toDateStr(selectedDate),
          meal_type: selectedMealType,
          ...values,
        });
        toast.success("Menu ditambahkan");
      }
      setModalOpen(false);
    } catch {
      toast.error("Gagal menyimpan menu");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMeal.mutateAsync(id);
      setDetailMeal(null);
      toast.success("Menu dihapus");
    } catch {
      toast.error("Gagal menghapus menu");
    }
  };

  const isThisWeek = toDateStr(weekStart) === toDateStr(startOfWeek(today, { weekStartsOn: 1 }));

  return (
    <div className="space-y-5">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Jadwal Makanan</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Rencanakan menu masakan keluarga tiap harinya.</p>
        </div>
        <NotificationBanner />
      </div>

      {/* ── Navigasi minggu ──────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="px-2.5 py-2 text-neutral-400 hover:bg-neutral-50 border-r border-neutral-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(today, { weekStartsOn: 1 }))}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {isThisWeek ? "Minggu Ini" : format(weekStart, "d MMM", { locale: dateLocale })}
          </button>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="px-2.5 py-2 text-neutral-400 hover:bg-neutral-50 border-l border-neutral-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm text-neutral-500 capitalize">
          {format(weekDays[0], "d MMM", { locale: dateLocale })} – {format(weekDays[6], "d MMM yyyy", { locale: dateLocale })}
        </span>
      </div>

      {/* ── Grid mingguan ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
        {/* Scroll wrapper — horizontal scroll di mobile */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Header hari */}
            <div className="grid grid-cols-8 border-b border-neutral-100">
              {/* Kolom label waktu makan */}
              <div className="py-3 px-3 bg-neutral-50" />
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={i}
                    className={cn(
                      "py-3 px-2 text-center border-l border-neutral-100",
                      isToday && "bg-primary-50"
                    )}
                  >
                    <p className={cn("text-[11px] font-bold uppercase tracking-wider", isToday ? "text-primary-600" : "text-neutral-400")}>
                      {DAY_LABELS[i]}
                    </p>
                    <p className={cn("text-base font-bold mt-0.5", isToday ? "text-primary-700" : "text-neutral-700")}>
                      {format(day, "d")}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Baris per waktu makan */}
            {MEAL_TYPES.map((mt) => (
              <div key={mt.value} className="grid grid-cols-8 border-b border-neutral-100 last:border-0">
                {/* Label waktu makan */}
                <div className="flex flex-col justify-center px-3 py-3 bg-neutral-50 border-r border-neutral-100">
                  <span className="text-base">{mt.emoji}</span>
                  <span className="text-xs font-semibold text-neutral-700 mt-0.5">{mt.label}</span>
                  <span className="text-[10px] text-neutral-400">{mt.time}</span>
                </div>

                {/* Slot per hari */}
                {weekDays.map((day, i) => {
                  const slotMeals = getMealsForSlot(meals, day, mt.value);
                  const isToday   = isSameDay(day, today);
                  return (
                    <div
                      key={i}
                      className={cn("p-2 border-l border-neutral-100 min-h-[72px] flex flex-col gap-1", isToday && "bg-primary-50/30")}
                    >
                      {isLoading ? (
                        <Skeleton className="h-12 w-full rounded-lg" />
                      ) : (
                        <>
                          {slotMeals.map((meal) => (
                            <MealSlotCard key={meal.id} meal={meal} onDetail={openDetail} />
                          ))}
                          <AddSlotButton onClick={() => openAdd(day, mt.value)} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Detail Modal ──────────────────────────────────────── */}
      <MealDetailModal
        meal={detailMeal}
        onClose={() => setDetailMeal(null)}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={deleteMeal.isPending}
      />

      {/* ── Form Modal ────────────────────────────────────────── */}
      <MealFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        mealType={selectedMealType}
        date={selectedDate}
        editingMeal={editingMeal}
        isSaving={createMeal.isPending || updateMeal.isPending}
      />
    </div>
  );
}

// ─── Banner notifikasi ────────────────────────────────────────────────────────
function NotificationBanner() {
  const [status, setStatus] = useState<"idle" | "granted" | "denied" | "loading">("idle");

  const requestNotification = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("Browser tidak mendukung push notification");
      return;
    }
    setStatus("loading");
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        await subscribeToPush();
        setStatus("granted");
        toast.success("Notifikasi menu harian aktif! 🔔");
      } else {
        setStatus("denied");
      }
    } catch {
      setStatus("idle");
      toast.error("Gagal mengaktifkan notifikasi");
    }
  };

  if (status === "granted") return null;

  return (
    <button
      onClick={requestNotification}
      disabled={status === "loading" || status === "denied"}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm",
        status === "denied"
          ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          : "bg-primary-600 text-white hover:bg-primary-700"
      )}
    >
      <Bell className="h-4 w-4" />
      {status === "loading" ? "Mengaktifkan..." : status === "denied" ? "Notifikasi ditolak" : "Aktifkan Notifikasi"}
    </button>
  );
}

// ─── Push subscription helper ─────────────────────────────────────────────────
async function subscribeToPush() {
  const reg = await navigator.serviceWorker.ready;

  // Ambil VAPID public key dari backend
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/vapid-key`);
  const { public_key } = await res.json();
  if (!public_key) return;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(public_key) as unknown as BufferSource,
  });

  const json = sub.toJSON();
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh:   (json.keys as Record<string, string>)?.p256dh,
      auth:     (json.keys as Record<string, string>)?.auth,
    }),
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output  = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
