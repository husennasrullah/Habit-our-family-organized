"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_LABELS } from "@/lib/calendarUtils";
import type { CalendarEvent } from "@/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const eventSchema = z.object({
  title:            z.string().min(1, "Judul wajib diisi"),
  description:      z.string().optional(),
  start_at:         z.string().min(1, "Waktu mulai wajib diisi"),
  end_at:           z.string().min(1, "Waktu selesai wajib diisi"),
  is_all_day:       z.boolean(),
  type:             z.enum(["general", "school", "medical", "birthday", "vacation"]),
  color:            z.string(),
  is_recurring:     z.boolean(),
  reminder_minutes: z.coerce.number().min(0),
});

export type EventFormValues = z.infer<typeof eventSchema>;

// ─── Color picker options ─────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { value: "sky",     label: "Sky",     dot: "bg-sky-500" },
  { value: "rose",    label: "Rose",    dot: "bg-rose-500" },
  { value: "violet",  label: "Violet",  dot: "bg-violet-500" },
  { value: "amber",   label: "Amber",   dot: "bg-amber-500" },
  { value: "emerald", label: "Emerald", dot: "bg-emerald-500" },
  { value: "orange",  label: "Orange",  dot: "bg-orange-500" },
  { value: "pink",    label: "Pink",    dot: "bg-pink-500" },
  { value: "indigo",  label: "Indigo",  dot: "bg-indigo-500" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface EventModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onSave:       (values: EventFormValues) => void;
  onDelete?:    () => void;
  initialDate?: Date;
  event?:       CalendarEvent | null; // null = create mode
  isSaving?:    boolean;
  isDeleting?:  boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateTimeLocal(iso: string): string {
  try {
    return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return iso;
  }
}

function toISO(local: string): string {
  try {
    return new Date(local).toISOString();
  } catch {
    return local;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  event,
  isSaving,
  isDeleting,
}: EventModalProps) {
  const isEditing = !!event;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title:            "",
      description:      "",
      start_at:         initialDate
        ? format(initialDate, "yyyy-MM-dd'T'HH:mm")
        : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end_at:           initialDate
        ? format(initialDate, "yyyy-MM-dd'T'HH:mm")
        : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      is_all_day:       false,
      type:             "general",
      color:            "sky",
      is_recurring:     false,
      reminder_minutes: 0,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (event) {
      reset({
        title:            event.title,
        description:      event.description ?? "",
        start_at:         toDateTimeLocal(event.start_at),
        end_at:           toDateTimeLocal(event.end_at),
        is_all_day:       event.is_all_day,
        type:             event.type,
        color:            event.color,
        is_recurring:     event.is_recurring,
        reminder_minutes: event.reminder_minutes,
      });
    } else {
      reset({
        title:            "",
        description:      "",
        start_at:         initialDate
          ? format(initialDate, "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end_at:           initialDate
          ? format(initialDate, "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        is_all_day:       false,
        type:             "general",
        color:            "sky",
        is_recurring:     false,
        reminder_minutes: 0,
      });
    }
  }, [event, initialDate, reset]);

  const selectedColor  = watch("color");
  const isAllDay       = watch("is_all_day");

  const onSubmit = (values: EventFormValues) => {
    onSave({
      ...values,
      start_at: toISO(values.start_at),
      end_at:   toISO(values.end_at),
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEditing ? "Edit Event" : "Tambah Event"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="title">Judul *</Label>
            <Input
              id="title"
              placeholder="Nama event"
              {...register("title")}
              className={cn(errors.title && "border-error-500")}
            />
            {errors.title && (
              <p className="text-xs text-error-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Deskripsi</Label>
            <textarea
              id="description"
              rows={2}
              placeholder="Opsional"
              {...register("description")}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm placeholder-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 resize-none"
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_all_day"
              {...register("is_all_day")}
              className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400"
            />
            <Label htmlFor="is_all_day" className="cursor-pointer font-normal">
              Sepanjang hari
            </Label>
          </div>

          {/* Date/time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start_at">Mulai *</Label>
              <Input
                id="start_at"
                type={isAllDay ? "date" : "datetime-local"}
                {...register("start_at")}
                className={cn(errors.start_at && "border-error-500")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end_at">Selesai *</Label>
              <Input
                id="end_at"
                type={isAllDay ? "date" : "datetime-local"}
                {...register("end_at")}
                className={cn(errors.end_at && "border-error-500")}
              />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-1">
            <Label htmlFor="type">Tipe</Label>
            <select
              id="type"
              {...register("type")}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <Label>Warna</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(({ value, label, dot }) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  onClick={() => setValue("color", value)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full transition-transform",
                    selectedColor === value ? "scale-125 ring-2 ring-offset-1 ring-neutral-400" : "hover:scale-110"
                  )}
                >
                  <span className={cn("h-5 w-5 rounded-full", dot)} />
                </button>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="space-y-1">
            <Label htmlFor="reminder_minutes">Pengingat (menit sebelum)</Label>
            <select
              id="reminder_minutes"
              {...register("reminder_minutes")}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
            >
              <option value={0}>Tidak ada</option>
              <option value={5}>5 menit</option>
              <option value={10}>10 menit</option>
              <option value={15}>15 menit</option>
              <option value={30}>30 menit</option>
              <option value={60}>1 jam</option>
              <option value={1440}>1 hari</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Hapus
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              form=""
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              {isEditing ? "Simpan" : "Buat Event"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
