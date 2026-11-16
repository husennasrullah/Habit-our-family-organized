import type { CalendarEvent } from "@/types";
export const CALENDAR_SOURCES = [
  { id: "event", label: "Acara", agenda: true },
  { id: "task", label: "Tugas", agenda: true },
  { id: "meal", label: "Makan", agenda: true },
  { id: "trip", label: "Liburan", agenda: true },
  { id: "itinerary", label: "Kegiatan liburan", agenda: true },
  { id: "vaccine", label: "Vaksin", agenda: true, adult: true },
  { id: "birthday", label: "Ulang tahun", agenda: true },
  { id: "goal", label: "Target tabungan", agenda: true, adult: true },
  { id: "memory", label: "Kenangan", agenda: false },
  { id: "growth", label: "Pertumbuhan", agenda: false, adult: true },
  { id: "health", label: "Kesehatan", agenda: false, adult: true },
  { id: "milestone", label: "Milestone", agenda: false, adult: true },
  { id: "expense", label: "Pengeluaran", agenda: false, adult: true },
  { id: "budget", label: "Periode anggaran", agenda: false, adult: true },
  { id: "trip_expense", label: "Biaya liburan", agenda: false, adult: true },
];
export const AGENDA_SOURCES = CALENDAR_SOURCES.filter((s) => s.agenda).map(
  (s) => s.id,
);
export function sourceLabel(event: CalendarEvent) {
  return (
    CALENDAR_SOURCES.find((s) => s.id === (event.source || "event"))?.label ??
    "Acara"
  );
}
export function isAgenda(event: CalendarEvent) {
  return AGENDA_SOURCES.includes(event.source || "event");
}
export const MENU_CALENDAR_SOURCES: Record<string, string> = {
  Tugas: "task",
  "Jadwal Makan": "meal",
  Keuangan: "goal,expense,budget,trip_expense",
  Anak: "vaccine,birthday,growth,health,milestone",
  Kenangan: "memory",
  Liburan: "trip,itinerary",
  Pengaturan: "birthday",
};
export function calendarHref(date?: string, source?: string, event?: string) {
  const qs = new URLSearchParams();
  if (date) qs.set("date", date.slice(0, 10));
  if (source) qs.set("sources", source);
  if (event) qs.set("event", event);
  return `/calendar${qs.size ? `?${qs}` : ""}`;
}
