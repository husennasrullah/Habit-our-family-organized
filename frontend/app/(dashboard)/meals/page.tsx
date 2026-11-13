"use client";

import { isRecipeURL, mealFormSchema, type MealFormValues } from "@/lib/mealPlans";
import { supportsPush, currentPushSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/pushNotification";
import { AxiosError } from "axios";
import { QueryError } from "@/components/shared/QueryError";
import { PageHeader } from "@/components/shared/PageHeader";
import { ModalFrame } from "@/components/shared/ModalFrame";

import { useState, useCallback, useEffect } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Trash2,
  Bell,
  X,
  UtensilsCrossed,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns";
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

const MEAL_TYPES: {
  value: MealType;
  label: string;
  emoji: string;
  time: string;
}[] = [
  { value: "breakfast", label: "Sarapan", emoji: "🌅", time: "06:00–09:00" },
  { value: "lunch", label: "Makan Siang", emoji: "☀️", time: "11:00–13:00" },
  { value: "dinner", label: "Makan Malam", emoji: "🌙", time: "18:00–20:00" },
];

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function toDateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function getMealsForSlot(
  meals: MealPlan[],
  date: Date,
  mealType: MealType,
): MealPlan[] {
  return meals.filter(
    (m) => m.date.slice(0, 10) === toDateStr(date) && m.meal_type === mealType,
  );
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
      className="group w-full text-left rounded-lg border border-border dark:border-primary-900 bg-primary-50 dark:bg-primary-950 p-2.5 hover:bg-primary-100 dark:hover:bg-primary-900 hover:border-primary-200 transition-colors"
      aria-label={`Buka menu ${meal.name}`}
    >
      <p className="text-xs font-semibold text-foreground dark:text-foreground leading-snug line-clamp-2">
        {meal.name}
      </p>
      {meal.notes && (
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {meal.notes}
        </p>
      )}
      {meal.recipe_url && (
        <span className="mt-0.5 flex items-center gap-1 text-xs text-primary-600">
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
  const dateLabel = format(
    new Date(meal.date.slice(0, 10) + "T00:00:00"),
    "EEEE, d MMMM yyyy",
    { locale: dateLocale },
  );

  return (
    <ModalFrame
      className="meal-dialog fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
      onClose={onClose}
      aria-label={meal.name}
    >
      <div className="bg-card dark:bg-card w-full sm:max-w-[360px] rounded-t-2xl sm:rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-5 pb-4 border-b border-border dark:border-border">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{mealMeta?.emoji}</span>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {mealMeta?.label} · {mealMeta?.time}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dateLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-5 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Menu
            </p>
            <p className="text-lg font-bold text-foreground dark:text-neutral-50">
              {meal.name}
            </p>
          </div>

          {meal.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Catatan
              </p>
              <p className="text-sm text-foreground">{meal.notes}</p>
            </div>
          )}

          {meal.recipe_url && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Link Resep
              </p>
              {isRecipeURL(meal.recipe_url) ? <a
                href={meal.recipe_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {meal.recipe_url}
              </a> : <p className="text-xs text-muted-foreground">Tautan resep tidak valid. Edit menu untuk memperbaruinya.</p>}
            </div>
          )}

          {!meal.notes && !meal.recipe_url && (
            <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
              <UtensilsCrossed className="h-8 w-8 mb-2" />
              <p className="text-xs">Tidak ada catatan tambahan</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 pb-5 flex gap-2">
          <button
            onClick={() => onDelete(meal.id)}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 transition-colors"
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
    </ModalFrame>
  );
}

function AddSlotButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-full rounded-lg border border-dashed border-border py-1.5 flex items-center justify-center text-muted-foreground hover:border-primary-300 hover:text-primary-600 transition-colors"
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
  onSave: (values: MealFormValues) => void;
  mealType: MealType;
  date: Date;
  editingMeal?: MealPlan;
  isSaving: boolean;
}) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [recipeURL, setRecipeURL] = useState("");
  const [formDate, setFormDate] = useState(toDateStr(date));
  const [formType, setFormType] = useState<MealType>(mealType);
  const [formError, setFormError] = useState("");

  // Sync state setiap kali modal dibuka atau editingMeal berganti
  useEffect(() => {
    if (isOpen) {
      setFormDate(toDateStr(date));
      setFormType(mealType);
      setFormError("");
      setName(editingMeal?.name ?? "");
      setNotes(editingMeal?.notes ?? "");
      setRecipeURL(editingMeal?.recipe_url ?? "");
    }
  }, [isOpen, editingMeal, date, mealType]);

  if (!isOpen) return null;

  const mealLabel = MEAL_TYPES.find((m) => m.value === formType)?.label ?? "";
  const formDay = new Date(formDate + "T00:00:00");
  const dateLabel = Number.isNaN(formDay.getTime()) ? "Pilih tanggal" : format(formDay, "EEEE, d MMMM yyyy", { locale: dateLocale });

  return (
    <ModalFrame
      className="meal-dialog fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClose={() => { if (!isSaving) onClose(); }}
    >
      <div className="bg-card dark:bg-card rounded-2xl shadow-xl w-full max-w-[360px]">
        <div className="px-4 py-4 border-b border-border dark:border-border">
          <h2 className="text-base font-semibold text-foreground dark:text-neutral-50">
            {editingMeal ? "Edit" : "Tambah"} {mealLabel}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
        </div>
        <form id="meal-form" onSubmit={(event) => {
          event.preventDefault();
          if (isSaving) return;
          const parsed = mealFormSchema.safeParse({ name, notes, recipe_url: recipeURL, date: formDate, meal_type: formType });
          if (!parsed.success) { setFormError(parsed.error.issues[0].message); return; }
          setFormError(""); onSave(parsed.data);
        }} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="meal-date" className="text-xs font-medium">Tanggal</label>
            <input id="meal-date" type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)} className="mt-1 w-full min-w-0 rounded-lg border border-border bg-card px-2 py-2 text-sm" /></div>
            <div><label htmlFor="meal-type" className="text-xs font-medium">Waktu makan</label>
            <select id="meal-type" value={formType} onChange={(e) => setFormType(e.target.value as MealType)} className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-2 text-sm">
              {MEAL_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select></div>
          </div>
          <div>
            <label
              className="text-xs font-medium text-foreground dark:text-muted-foreground"
              htmlFor="field-page-dashboardmeals-0"
            >
              Nama Masakan *
            </label>
            <input
              required
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border dark:border-border bg-card dark:bg-muted text-foreground dark:text-foreground px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
              placeholder="contoh: Nasi Goreng Spesial"
              autoFocus
              id="field-page-dashboardmeals-0"
            />
          </div>
          <div>
            <label
              className="text-xs font-medium text-foreground dark:text-muted-foreground"
              htmlFor="field-page-dashboardmeals-1"
            >
              Catatan Singkat
            </label>
            <input
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border dark:border-border bg-card dark:bg-muted text-foreground dark:text-foreground px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
              placeholder="bahan khusus, porsi, dll."
              id="field-page-dashboardmeals-1"
            />
          </div>
          <div>
            <label
              className="text-xs font-medium text-foreground dark:text-muted-foreground"
              htmlFor="field-page-dashboardmeals-2"
            >
              Link Resep (opsional)
            </label>
            <input
              maxLength={2048}
              value={recipeURL}
              onChange={(e) => setRecipeURL(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border dark:border-border bg-card dark:bg-muted text-foreground dark:text-foreground px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
              placeholder="https://..."
              type="url"
              id="field-page-dashboardmeals-2"
            />
          </div>
          {formError && <p role="alert" className="text-xs text-red-600">{formError}</p>}
        </form>
        <div className="px-4 pb-5 flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-foreground dark:text-foreground border border-border dark:border-border hover:bg-muted dark:hover:bg-neutral-800"
          >
            Batal
          </button>
          <button
            type="submit"
            form="meal-form"
            disabled={!name.trim() || isSaving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────

export default function MealsPage() {
  const today = new Date();
  const [activeDay, setActiveDay] = useState((today.getDay() + 6) % 7);
  const [weekStart, setWeekStart] = useState<Date>(
    () => startOfWeek(today, { weekStartsOn: 1 }), // Mulai Senin
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [detailMeal, setDetailMeal] = useState<MealPlan | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>("breakfast");
  const [editingMeal, setEditingMeal] = useState<MealPlan | undefined>();

  const weekDays = getWeekDays(weekStart);
  const from = toDateStr(weekDays[0]);
  const to = toDateStr(weekDays[6]);

  const {
    data: meals = [],
    isLoading,
    isError,
    refetch,
  } = useMealPlans(from, to);
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

  const handleSave = async (values: MealFormValues) => {
    try {
      if (editingMeal) {
        await updateMeal.mutateAsync({ id: editingMeal.id, ...values });
        toast.success("Menu diperbarui");
      } else {
        await createMeal.mutateAsync({
          ...values,
        });
        toast.success("Menu ditambahkan");
      }
      setModalOpen(false);
    } catch (error) {
      toast.error(error instanceof AxiosError ? error.response?.data?.message ?? "Gagal menyimpan menu" : "Gagal menyimpan menu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus menu ini dari jadwal makan?")) return;
    try {
      await deleteMeal.mutateAsync(id);
      setDetailMeal(null);
      toast.success("Menu dihapus");
    } catch {
      toast.error("Gagal menghapus menu");
    }
  };

  const isThisWeek =
    toDateStr(weekStart) === toDateStr(startOfWeek(today, { weekStartsOn: 1 }));

  return (
    <div className="space-y-4">
      {/* ── Header ───────────────────────────────────────────── */}
      <PageHeader
        title="Jadwal Makan"
        description="Dari rencana sederhana, jadi hidangan untuk bersama."
        action={
          <>
            <NotificationBanner />
          </>
        }
      />

      {/* ── Navigasi minggu ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="px-2.5 py-2 text-muted-foreground hover:bg-muted border-r border-border"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              { setWeekStart(startOfWeek(today, { weekStartsOn: 1 })); setActiveDay((today.getDay() + 6) % 7); }
            }
            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {isThisWeek
              ? "Hari Ini"
              : format(weekStart, "d MMM", { locale: dateLocale })}
          </button>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="px-2.5 py-2 text-muted-foreground hover:bg-muted border-l border-border"
            aria-label="Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm text-muted-foreground capitalize">
          {format(weekDays[0], "d MMM", { locale: dateLocale })} –{" "}
          {format(weekDays[6], "d MMM yyyy", { locale: dateLocale })}
        </span>
      </div>

      {isError ? (
        <QueryError retry={() => void refetch()} />
      ) : (
        <>
          <div className="space-y-4 md:hidden">
            <div className="grid grid-cols-7 gap-1 rounded-2xl border border-border bg-card p-2">
              {weekDays.map((day, index) => (
                <button
                  key={index}
                  aria-label={format(day, "EEEE, d MMMM", {
                    locale: dateLocale,
                  })}
                  aria-pressed={index === activeDay}
                  onClick={() => setActiveDay(index)}
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-xs",
                    index === activeDay
                      ? "bg-primary-600 text-white"
                      : "text-muted-foreground",
                  )}
                >
                  <span>{DAY_LABELS[index]}</span>
                  <span className="text-sm font-semibold">
                    {format(day, "d")}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-sm font-medium">
              {format(weekDays[activeDay], "EEEE, d MMMM", {
                locale: dateLocale,
              })}
            </p>
            {MEAL_TYPES.map((type) => (
              <section
                key={type.value}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold">{type.label}</h2>
                  <span className="text-xs text-muted-foreground">
                    {type.time}
                  </span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-20 rounded-xl" />
                ) : (
                  <div className="space-y-2">
                    {getMealsForSlot(
                      meals,
                      weekDays[activeDay],
                      type.value,
                    ).map((meal) => (
                      <MealSlotCard
                        key={meal.id}
                        meal={meal}
                        onDetail={openDetail}
                      />
                    ))}
                    {!getMealsForSlot(meals, weekDays[activeDay], type.value)
                      .length && (
                      <p className="py-2 text-sm text-muted-foreground">
                        Mau masak apa hari ini?
                      </p>
                    )}
                    <button
                      onClick={() => openAdd(weekDays[activeDay], type.value)}
                      className="flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-primary-700 dark:text-primary-200"
                    >
                      <Plus size={16} />
                      Tambah menu
                    </button>
                  </div>
                )}
              </section>
            ))}
          </div>
          {/* ── Grid mingguan ─────────────────────────────────────── */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
            {/* Scroll wrapper — horizontal scroll di mobile */}
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                {/* Header hari */}
                <div className="grid grid-cols-8 border-b border-border">
                  {/* Kolom label waktu makan */}
                  <div className="py-3 px-3 bg-muted" />
                  {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, today);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "py-3 px-2 text-center border-l border-border",
                          isToday && "bg-primary-50",
                        )}
                      >
                        <p
                          className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            isToday
                              ? "text-primary-600"
                              : "text-muted-foreground",
                          )}
                        >
                          {DAY_LABELS[i]}
                        </p>
                        <p
                          className={cn(
                            "text-base font-bold mt-0.5",
                            isToday ? "text-primary-700" : "text-foreground",
                          )}
                        >
                          {format(day, "d")}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Baris per waktu makan */}
                {MEAL_TYPES.map((mt) => (
                  <div
                    key={mt.value}
                    className="grid grid-cols-8 border-b border-border last:border-0"
                  >
                    {/* Label waktu makan */}
                    <div className="flex flex-col justify-center px-3 py-3 bg-muted border-r border-border">
                      <span className="text-base">{mt.emoji}</span>
                      <span className="text-xs font-semibold text-foreground mt-0.5">
                        {mt.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {mt.time}
                      </span>
                    </div>

                    {/* Slot per hari */}
                    {weekDays.map((day, i) => {
                      const slotMeals = getMealsForSlot(meals, day, mt.value);
                      const isToday = isSameDay(day, today);
                      return (
                        <div
                          key={i}
                          className={cn(
                            "p-2 border-l border-border min-h-[72px] flex flex-col gap-1",
                            isToday && "bg-primary-50/30",
                          )}
                        >
                          {isLoading ? (
                            <Skeleton className="h-12 w-full rounded-lg" />
                          ) : (
                            <>
                              {slotMeals.map((meal) => (
                                <MealSlotCard
                                  key={meal.id}
                                  meal={meal}
                                  onDetail={openDetail}
                                />
                              ))}
                              <AddSlotButton
                                label={`Tambah ${mt.label}, ${format(day, "EEEE, d MMMM", { locale: dateLocale })}`}
                                onClick={() => openAdd(day, mt.value)}
                              />
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
        </>
      )}

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
        onClose={() => { if (!createMeal.isPending && !updateMeal.isPending) setModalOpen(false); }}
        onSave={handleSave}
        mealType={selectedMealType}
        date={selectedDate}
        editingMeal={editingMeal}
        isSaving={createMeal.isPending || updateMeal.isPending}
      />
    </div>
  );
}

// ─── Notifikasi ──────────────────────────────────────────────────────────────
function NotificationBanner() {
  const [status, setStatus] = useState<"checking" | "idle" | "granted" | "denied" | "loading" | "unsupported">("checking");
  const [error, setError] = useState("");
  const check = useCallback(async () => {
    if (!supportsPush()) { setStatus("unsupported"); return; }
    if (Notification.permission === "denied") { setStatus("denied"); return; }
    try { setStatus(await currentPushSubscription() ? "granted" : "idle"); setError(""); }
    catch { setStatus("idle"); setError("Status notifikasi belum dapat diperiksa."); }
  }, []);
  useEffect(() => { void check(); }, [check]);
  const toggle = async () => {
    const previous = status;
    setStatus("loading"); setError("");
    try {
      if (previous === "granted") {
        await unsubscribeFromPush(); setStatus("idle"); toast.success("Notifikasi dinonaktifkan");
      } else {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") { setStatus(perm === "denied" ? "denied" : "idle"); return; }
        await subscribeToPush(); setStatus("granted"); toast.success("Notifikasi menu harian aktif");
      }
    } catch (err) {
      const active = await currentPushSubscription().catch(() => previous === "granted");
      setStatus(active ? "granted" : "idle");
      const message = err instanceof AxiosError ? err.response?.data?.message ?? "Gagal memperbarui notifikasi. Coba lagi." : err instanceof Error ? err.message : "Gagal memperbarui notifikasi";
      setError(message); toast.error(message);
    }
  };
  if (status === "unsupported") return <p className="text-xs text-muted-foreground">Notifikasi tidak tersedia di browser ini.</p>;
  return <div className="max-w-sm space-y-1">
    <button onClick={status === "denied" ? () => void check() : () => void toggle()} disabled={status === "loading" || status === "checking"}
      className="flex min-h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold disabled:opacity-50">
      <Bell className="h-4 w-4" />
      {status === "checking" ? "Memeriksa notifikasi..." : status === "loading" ? "Memproses..." : status === "granted" ? "Nonaktifkan Notifikasi" : status === "denied" ? "Periksa Ulang Izin" : "Aktifkan Notifikasi"}
    </button>
    {status === "denied" && <p className="text-xs text-muted-foreground">Izinkan notifikasi melalui pengaturan browser, lalu periksa ulang.</p>}
    {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>;
}
