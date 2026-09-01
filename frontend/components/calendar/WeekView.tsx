"use client";

import { format, isToday, isSameDay, parseISO } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getWeekDays, getEventsForDay, getColor } from "@/lib/calendarUtils";
import type { CalendarEvent } from "@/types";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekView({ currentDate, events, onEventClick, onSlotClick }: WeekViewProps) {
  const days = getWeekDays(currentDate);

  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* Header row — day names */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-neutral-200 bg-neutral-50">
        <div /> {/* gutter */}
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div key={day.toISOString()} className="py-2 text-center border-l border-neutral-100">
              <p className="text-xs font-medium uppercase text-neutral-400">
                {format(day, "EEE", { locale: dateLocale })}
              </p>
              <span
                className={cn(
                  "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  today ? "bg-primary-500 text-white" : "text-neutral-700"
                )}
              >
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[560px]">
        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          {/* Time labels */}
          <div>
            {HOURS.map((h) => (
              <div key={h} className="h-14 border-b border-neutral-100 pr-2 text-right">
                <span className="text-xs text-neutral-400 leading-none relative -top-2">
                  {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(events, day);
            return (
              <div key={day.toISOString()} className="relative border-l border-neutral-100">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="h-14 border-b border-neutral-100 cursor-pointer hover:bg-primary-50/40 transition-colors"
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(h, 0, 0, 0);
                      onSlotClick(d);
                    }}
                  />
                ))}

                {/* Event blocks */}
                {dayEvents.map((event) => {
                  let startH: number;
                  let durationH: number;
                  try {
                    const start = parseISO(event.start_at);
                    const end   = parseISO(event.end_at);
                    startH    = start.getHours() + start.getMinutes() / 60;
                    durationH = Math.max(
                      (end.getTime() - start.getTime()) / 3_600_000,
                      0.5
                    );
                  } catch {
                    return null;
                  }

                  const { bg, text } = getColor(event.color);
                  const top    = startH * 56; // 56px per hour
                  const height = durationH * 56;

                  return (
                    <button
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      style={{ top, height: Math.max(height, 24) }}
                      className={cn(
                        "absolute left-0.5 right-0.5 overflow-hidden rounded px-1 text-left text-xs font-medium transition-opacity hover:opacity-80",
                        bg,
                        text
                      )}
                    >
                      <span className="truncate block leading-tight">{event.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
