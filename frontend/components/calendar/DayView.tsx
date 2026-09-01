"use client";

import { format, parseISO, isToday } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getEventsForDay, getColor, EVENT_TYPE_LABELS } from "@/lib/calendarUtils";
import type { CalendarEvent } from "@/types";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView({ currentDate, events, onEventClick, onSlotClick }: DayViewProps) {
  const dayEvents = getEventsForDay(events, currentDate);
  const today = isToday(currentDate);

  // Separate all-day from timed events
  const allDayEvents  = dayEvents.filter((e) => e.is_all_day);
  const timedEvents   = dayEvents.filter((e) => !e.is_all_day);

  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* Day header */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold",
            today ? "bg-primary-500 text-white" : "text-neutral-700"
          )}
        >
          {format(currentDate, "d")}
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-900 capitalize">
            {format(currentDate, "EEEE", { locale: dateLocale })}
          </p>
          <p className="text-xs text-neutral-400">
            {format(currentDate, "d MMMM yyyy", { locale: dateLocale })}
          </p>
        </div>
        <span className="ml-auto text-xs font-medium text-neutral-400">
          {dayEvents.length} event
        </span>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-neutral-200 px-4 py-2 space-y-1">
          <p className="text-xs font-medium uppercase text-neutral-400 mb-1">Sepanjang hari</p>
          {allDayEvents.map((event) => {
            const { bg, text } = getColor(event.color);
            return (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className={cn(
                  "w-full rounded px-2 py-1 text-left text-sm font-medium transition-opacity hover:opacity-80",
                  bg, text
                )}
              >
                {event.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[520px]">
        <div className="grid grid-cols-[64px_1fr]">
          {HOURS.map((h) => {
            const slotEvents = timedEvents.filter((e) => {
              try {
                return parseISO(e.start_at).getHours() === h;
              } catch { return false; }
            });

            return (
              <>
                {/* Hour label */}
                <div
                  key={`label-${h}`}
                  className="h-16 border-b border-neutral-100 pr-3 pt-1 text-right"
                >
                  <span className="text-xs text-neutral-400">
                    {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                  </span>
                </div>

                {/* Slot */}
                <div
                  key={`slot-${h}`}
                  className="relative h-16 border-b border-l border-neutral-100 p-1 cursor-pointer hover:bg-primary-50/40 transition-colors"
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setHours(h, 0, 0, 0);
                    onSlotClick(d);
                  }}
                >
                  <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                    {slotEvents.map((event) => {
                      const { bg, text } = getColor(event.color);
                      let timeLabel = "";
                      try {
                        timeLabel = format(parseISO(event.start_at), "HH:mm");
                      } catch { /* ignore */ }

                      return (
                        <button
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className={cn(
                            "w-full rounded px-2 py-1 text-left text-sm font-medium transition-opacity hover:opacity-80",
                            bg, text
                          )}
                        >
                          <span className="mr-2 text-xs opacity-70">{timeLabel}</span>
                          {event.title}
                          <span className="ml-1 text-xs opacity-60">
                            · {EVENT_TYPE_LABELS[event.type] ?? event.type}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })}
        </div>
      </div>
    </div>
  );
}
