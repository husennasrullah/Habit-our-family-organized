import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  parseISO as originalParseISO,
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

// Project WIB wall time into a local Date used by the calendar grid, independently of device timezone.
export function parseISO(value: string): Date {
  const actual = originalParseISO(value);
  if (
    value.length <= 10 ||
    Number.isNaN(actual.getTime()) ||
    !/(Z|[+-]\d{2}:?\d{2})$/i.test(value)
  )
    return actual;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(actual);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const projected = new Date(0);
  projected.setFullYear(get("year"), get("month") - 1, get("day"));
  projected.setHours(
    get("hour"),
    get("minute"),
    get("second"),
    actual.getUTCMilliseconds(),
  );
  return projected;
}
export function calendarNow() {
  return parseISO(new Date().toISOString());
}

export type CalendarView = "month" | "week" | "day";

// ─── Color map ────────────────────────────────────────────────────────────────

export const COLOR_MAP: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/60",
    text: "text-sky-800 dark:text-sky-200",
    dot: "bg-sky-500",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/60",
    text: "text-rose-800 dark:text-rose-200",
    dot: "bg-rose-500",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/60",
    text: "text-violet-800 dark:text-violet-200",
    dot: "bg-violet-500",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-800 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/60",
    text: "text-orange-800 dark:text-orange-200",
    dot: "bg-orange-500",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-950/60",
    text: "text-pink-800 dark:text-pink-200",
    dot: "bg-pink-500",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/60",
    text: "text-indigo-800 dark:text-indigo-200",
    dot: "bg-indigo-500",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950/60",
    text: "text-teal-800 dark:text-teal-200",
    dot: "bg-teal-500",
  },
};

export function getColor(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.sky;
}

// ─── Event type labels ────────────────────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<string, string> = {
  general: "Umum",
  school: "Sekolah",
  medical: "Medis",
  birthday: "Ulang Tahun",
  vacation: "Liburan",
};

// ─── Navigation helpers ───────────────────────────────────────────────────────

export function navigateDate(
  date: Date,
  direction: "prev" | "next",
  view: CalendarView,
): Date {
  if (view === "month")
    return direction === "prev" ? subMonths(date, 1) : addMonths(date, 1);
  if (view === "week")
    return direction === "prev" ? subWeeks(date, 1) : addWeeks(date, 1);
  return direction === "prev" ? subDays(date, 1) : addDays(date, 1);
}

export function getViewLabel(date: Date, view: CalendarView): string {
  if (view === "month") return format(date, "MMMM yyyy", { locale: id });
  if (view === "week") {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    if (isSameMonth(start, end))
      return format(start, "MMMM yyyy", { locale: id });
    return `${format(start, "MMM", { locale: id })} – ${format(end, "MMM yyyy", { locale: id })}`;
  }
  return format(date, "EEEE, d MMMM yyyy", { locale: id });
}

// ─── Date range for API ───────────────────────────────────────────────────────

export function getApiDateRange(
  date: Date,
  view: CalendarView,
): { from: string; to: string } {
  let start: Date;
  let end: Date;

  if (view === "month") {
    start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  } else if (view === "week") {
    start = startOfWeek(date, { weekStartsOn: 1 });
    end = endOfWeek(date, { weekStartsOn: 1 });
  } else {
    start = startOfDay(date);
    end = endOfDay(date);
  }

  return {
    from: new Date(
      format(start, "yyyy-MM-dd'T'HH:mm:ss.SSS") + "+07:00",
    ).toISOString(),
    to: new Date(
      format(end, "yyyy-MM-dd'T'HH:mm:ss.SSS") + "+07:00",
    ).toISOString(),
  };
}

// ─── Month grid ───────────────────────────────────────────────────────────────

export function getMonthGrid(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

// ─── Week days ────────────────────────────────────────────────────────────────

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

// ─── Filter events for a day ──────────────────────────────────────────────────

export function getEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((e) => {
    try {
      const start = parseISO(e.start_at);
      const end = parseISO(e.end_at);
      return (
        isSameDay(start, day) ||
        isSameDay(end, day) ||
        (start <= day && end >= day)
      );
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

export { format, isSameDay, isSameMonth };
export { id as dateLocale };

// Clip events to the visible day and place simultaneous events beside one another.
export function layoutDayEvents(events: CalendarEvent[], day: Date) {
  const dayStart = startOfDay(day).getTime();
  const nextDay = addDays(startOfDay(day), 1).getTime();
  const rows = getEventsForDay(events, day)
    .filter((event) => !event.is_all_day)
    .map((event) => ({
      event,
      startMinute: Math.max(
        0,
        (parseISO(event.start_at).getTime() - dayStart) / 60000,
      ),
      endMinute: Math.min(
        1440,
        (parseISO(event.end_at).getTime() - dayStart) / 60000,
      ),
      lane: 0,
      lanes: 1,
    }))
    .filter(
      (row) =>
        parseISO(row.event.start_at).getTime() < nextDay &&
        row.endMinute > row.startMinute,
    )
    .sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute);
  const laneEnds: number[] = [];
  for (const row of rows) {
    let lane = laneEnds.findIndex((end) => end <= row.startMinute);
    if (lane === -1) lane = laneEnds.length;
    row.lane = lane;
    laneEnds[lane] = row.endMinute;
  }
  return rows.map((row) => ({ ...row, lanes: laneEnds.length }));
}
