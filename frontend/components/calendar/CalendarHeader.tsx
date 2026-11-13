"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  navigateDate,
  getViewLabel,
  type CalendarView,
} from "@/lib/calendarUtils";

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "month", label: "Bulan" },
  { value: "week", label: "Minggu" },
  { value: "day", label: "Hari" },
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
    <div className="calendar-toolbar">
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200 sm:flex">
          <CalendarDays size={19} />
        </span>
        <div className="min-w-0">
          <p className="mb-0.5 text-xs text-muted-foreground">
            Agenda keluarga
          </p>
          <h2
            className="text-base font-bold capitalize tracking-tight"
            aria-live="polite"
          >
            {getViewLabel(currentDate, view)}
          </h2>
        </div>
        <div className="ml-1 flex shrink-0 items-center gap-1">
          <button
            className="calendar-icon-button"
            aria-label="Sebelumnya"
            onClick={() =>
              onDateChange(navigateDate(currentDate, "prev", view))
            }
          >
            <ChevronLeft size={17} />
          </button>
          <button
            className="calendar-icon-button"
            aria-label="Berikutnya"
            onClick={() =>
              onDateChange(navigateDate(currentDate, "next", view))
            }
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onToday} className="calendar-today-button">
          Hari ini
        </button>
        <div className="calendar-view-switch" aria-label="Tampilan kalender">
          {VIEW_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onViewChange(value)}
              aria-pressed={view === value}
              className={cn(
                "calendar-view-option",
                view === value && "is-active",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={onAddEvent} className="calendar-add-button">
          <Plus size={16} />
          <span>Buat acara</span>
        </button>
      </div>
    </div>
  );
}
