"use client";

import { format, isSameDay, isSameMonth, isToday } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowUpRight, CalendarDays, Clock3, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMonthGrid,
  getEventsForDay,
  getColor,
  EVENT_TYPE_LABELS,
} from "@/lib/calendarUtils";
import { EventBadge } from "./EventBadge";
import type { CalendarEvent } from "@/types";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (day: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: (date: Date) => void;
  onOpenDay: () => void;
}
export function MonthView({
  currentDate,
  events,
  onDayClick,
  onEventClick,
  onAddEvent,
  onOpenDay,
}: MonthViewProps) {
  const days = getMonthGrid(currentDate);
  const selectedEvents = getEventsForDay(events, currentDate).sort(
    (a, b) =>
      Number(b.is_all_day) - Number(a.is_all_day) ||
      a.start_at.localeCompare(b.start_at),
  );
  const monthEvents = events.filter((event) =>
    days.some(
      (day) =>
        isSameMonth(day, currentDate) && getEventsForDay([event], day).length,
    ),
  );
  return (
    <div className="calendar-month-layout">
      <div className="calendar-month-card">
        <div className="calendar-month-caption">
          <span>
            <span className="calendar-status-dot" />
            Rencana kecil, waktu bersama.
          </span>
          <span>{monthEvents.length} acara bulan ini</span>
        </div>
        <div className="grid grid-cols-7 border-b border-border/60">
          {WEEKDAYS.map((label, index) => (
            <div
              key={label}
              className={cn(
                "calendar-weekday",
                index > 4 && "text-primary-700 dark:text-primary-300",
              )}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(events, day);
            const selected = isSameDay(day, currentDate),
              today = isToday(day),
              inMonth = isSameMonth(day, currentDate);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "calendar-month-cell",
                  index % 7 !== 6 && "border-r",
                  index < days.length - 7 && "border-b",
                  !inMonth && "is-outside",
                  selected && "is-selected",
                )}
              >
                <button
                  className="calendar-day-target"
                  onClick={() => onDayClick(day)}
                  aria-label={`${format(day, "d MMMM yyyy", { locale: id })}, ${dayEvents.length} agenda`}
                  aria-pressed={selected}
                  aria-current={today ? "date" : undefined}
                >
                  <span
                    className={cn(
                      "calendar-day-number",
                      today && "is-today",
                      selected && !today && "is-selected-number",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {today && (
                    <span className="calendar-today-label">Hari ini</span>
                  )}
                </button>
                <div className="calendar-cell-events">
                  {dayEvents.slice(0, 2).map((event) => (
                    <EventBadge
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      compact
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <button
                      onClick={() => onDayClick(day)}
                      className="calendar-more"
                    >
                      +{dayEvents.length - 2} lainnya
                    </button>
                  )}
                </div>
                <div className="calendar-cell-dots" aria-hidden="true">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      className={cn(
                        "h-1 w-1 rounded-full",
                        getColor(event.color).dot,
                      )}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="calendar-month-footer">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary-600" />
            Hari ini
          </span>
          <span>Pilih tanggal untuk melihat agenda</span>
        </div>
      </div>
      <aside className="calendar-agenda" aria-label="Agenda tanggal terpilih">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {isToday(currentDate) ? "AGENDA HARI INI" : "AGENDA PILIHAN"}
            </p>
            <h3 className="mt-2 text-lg font-bold tracking-tight">
              {format(currentDate, "EEEE", { locale: id })}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {format(currentDate, "d MMMM yyyy", { locale: id })}
            </p>
          </div>
          <span className="calendar-agenda-count">{selectedEvents.length}</span>
        </div>
        <div className="my-4 h-px bg-border/70" />
        {selectedEvents.length ? (
          <div className="space-y-3">
            {selectedEvents.map((event) => {
              const color = getColor(event.color);
              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="calendar-agenda-event"
                >
                  <span
                    className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      color.dot,
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold">
                      {event.title}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock3 size={12} />
                      {event.is_all_day
                        ? "Sepanjang hari"
                        : `${format(new Date(event.start_at), "HH:mm")} – ${format(new Date(event.end_at), "HH:mm")}`}
                    </span>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                        color.bg,
                        color.text,
                      )}
                    >
                      {EVENT_TYPE_LABELS[event.type] ?? "Umum"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="calendar-agenda-empty">
            <span className="calendar-empty-icon">
              <CalendarDays size={24} />
            </span>
            <h4 className="mt-3 text-sm font-semibold">
              Ruang untuk rencana baru
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Belum ada acara di tanggal ini.
              <br />
              Mau merencanakan waktu bersama?
            </p>
          </div>
        )}
        <button
          onClick={() => onAddEvent(currentDate)}
          className="calendar-agenda-add"
        >
          <Plus size={15} />
          Tambah acara
        </button>
        <button onClick={onOpenDay} className="calendar-open-day">
          Lihat jadwal harian
          <ArrowUpRight size={14} />
        </button>
      </aside>
    </div>
  );
}
