"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  navigateDate,
  getViewLabel,
  type CalendarView,
} from "@/lib/calendarUtils";

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "day", label: "Hari" },
  { value: "week", label: "Minggu" },
  { value: "month", label: "Bulan" },
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
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-foreground capitalize">
          {getViewLabel(currentDate, view)}
        </h2>

        {/* Nav: < Hari Ini > — sesuai mockup */}
        <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
          <button
            onClick={() =>
              onDateChange(navigateDate(currentDate, "prev", view))
            }
            className="px-2 py-1.5 text-muted-foreground hover:bg-muted transition-colors border-r border-border"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Hari Ini
          </button>
          <button
            onClick={() =>
              onDateChange(navigateDate(currentDate, "next", view))
            }
            className="px-2 py-1.5 text-muted-foreground hover:bg-muted transition-colors border-l border-border"
            aria-label="Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Kanan — view toggle + tambah */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View switcher sesuai mockup */}
        <div className="flex rounded-lg border border-border bg-card overflow-hidden">
          {VIEW_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onViewChange(value)}
              aria-pressed={view === value}
              className={cn(
                "px-4 py-1.5 text-sm font-medium transition-colors",
                view === value
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted",
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
