import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  getHours,
} from "date-fns";
import { id } from "date-fns/locale";
import type { CalendarEvent } from "@/types";

export type CalendarView = "month" | "week" | "day";

// ─── Color map ────────────────────────────────────────────────────────────────

export const COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  sky:     { bg: "bg-sky-100",     text: "text-sky-700",     dot: "bg-sky-500" },
  rose:    { bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500" },
  violet:  { bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500" },
  amber:   { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  orange:  { bg: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-500" },
  pink:    { bg: "bg-pink-100",    text: "text-pink-700",    dot: "bg-pink-500" },
  indigo:  { bg: "bg-indigo-100",  text: "text-indigo-700",  dot: "bg-indigo-500" },
  teal:    { bg: "bg-teal-100",    text: "text-teal-700",    dot: "bg-teal-500" },
};

export function getColor(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.sky;
}

// ─── Event type labels ────────────────────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<string, string> = {
  general:  "Umum",
  school:   "Sekolah",
  medical:  "Medis",
  birthday: "Ulang Tahun",
  vacation: "Liburan",
};

// ─── Navigation helpers ───────────────────────────────────────────────────────

export function navigateDate(
  date: Date,
  direction: "prev" | "next",
  view: CalendarView
): Date {
  if (view === "month") return direction === "prev" ? subMonths(date, 1) : addMonths(date, 1);
  if (view === "week")  return direction === "prev" ? subWeeks(date, 1)  : addWeeks(date, 1);
  return direction === "prev" ? subDays(date, 1) : addDays(date, 1);
}

export function getViewLabel(date: Date, view: CalendarView): string {
  if (view === "month") return format(date, "MMMM yyyy", { locale: id });
  if (view === "week") {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end   = endOfWeek(date, { weekStartsOn: 1 });
    if (isSameMonth(start, end)) return format(start, "MMMM yyyy", { locale: id });
    return `${format(start, "MMM", { locale: id })} – ${format(end, "MMM yyyy", { locale: id })}`;
  }
  return format(date, "EEEE, d MMMM yyyy", { locale: id });
}

// ─── Date range for API ───────────────────────────────────────────────────────

export function getApiDateRange(date: Date, view: CalendarView): { from: string; to: string } {
  let start: Date;
  let end: Date;

  if (view === "month") {
    start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    end   = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  } else if (view === "week") {
    start = startOfWeek(date, { weekStartsOn: 1 });
    end   = endOfWeek(date, { weekStartsOn: 1 });
  } else {
    start = startOfDay(date);
    end   = endOfDay(date);
  }

  return {
    from: start.toISOString(),
    to:   end.toISOString(),
  };
}

// ─── Month grid ───────────────────────────────────────────────────────────────

export function getMonthGrid(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end   = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

// ─── Week days ────────────────────────────────────────────────────────────────

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end   = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

// ─── Filter events for a day ──────────────────────────────────────────────────

export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => {
    try {
      const start = parseISO(e.start_at);
      const end   = parseISO(e.end_at);
      return isSameDay(start, day) || isSameDay(end, day) ||
        (start <= day && end >= day);
    } catch {
      return false;
    }
  });
}

// ─── Hour slots for day/week view ─────────────────────────────────────────────

export const HOUR_SLOTS = Array.from({ length: 24 }, (_, i) => i);

export function eventToTopPercent(event: CalendarEvent): number {
  const start = parseISO(event.start_at);
  return (getHours(start) / 24) * 100;
}

export { format, isSameDay, isSameMonth, parseISO };
export { id as dateLocale };
