"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigateDate, getViewLabel, type CalendarView } from "@/lib/calendarUtils";

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "day",   label: "Hari"   },
  { value: "week",  label: "Minggu" },
  { value: "month", label: "Bulan"  },
];

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onAddEvent: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onAddEvent,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Kiri — bulan/tahun + navigasi hari ini */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-neutral-900 capitalize">
          {getViewLabel(currentDate, view)}
        </h2>

        {/* Nav: < Hari Ini > — sesuai mockup */}
        <div className="flex items-center rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <button
            onClick={() => onDateChange(navigateDate(currentDate, "prev", view))}
            className="px-2 py-1.5 text-neutral-500 hover:bg-neutral-50 transition-colors border-r border-neutral-200"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Hari Ini
          </button>
          <button
            onClick={() => onDateChange(navigateDate(currentDate, "next", view))}
            className="px-2 py-1.5 text-neutral-500 hover:bg-neutral-50 transition-colors border-l border-neutral-200"
            aria-label="Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Kanan — view toggle + tambah */}
      <div className="flex items-center gap-2">
        {/* View switcher sesuai mockup */}
        <div className="flex rounded-lg border border-neutral-200 bg-white overflow-hidden">
          {VIEW_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onViewChange(value)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium transition-colors",
                view === value
                  ? "bg-neutral-100 text-neutral-900 font-semibold"
                  : "text-neutral-500 hover:bg-neutral-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tambah acara */}
        <button
          onClick={onAddEvent}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Buat Acara
        </button>
      </div>
    </div>
  );
}
