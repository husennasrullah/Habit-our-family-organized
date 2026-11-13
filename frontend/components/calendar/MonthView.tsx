"use client";

import { format, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { getMonthGrid, getEventsForDay } from "@/lib/calendarUtils";
import { EventBadge } from "./EventBadge";
import type { CalendarEvent } from "@/types";

const WEEKDAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (day: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({
  currentDate,
  events,
  onDayClick,
  onEventClick,
}: MonthViewProps) {
  const days = getMonthGrid(currentDate);
  const MAX_VISIBLE = 3;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_HEADERS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 flex-1 divide-x divide-neutral-100">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(events, day);
          const overflow = dayEvents.length - MAX_VISIBLE;
          const isCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}

              className={cn(
                "group relative min-h-[90px] cursor-pointer p-1 transition-colors hover:bg-muted",
                !isCurrentMonth && "bg-muted/50",
                idx % 7 !== 0 && "border-l border-border",
                idx >= 7 && "border-t border-border",
              )}
            >
              {/* Day number */}
              <div className="mb-1 flex justify-end">
                <button
                  aria-label={`${format(day, "d MMMM yyyy")}, ${dayEvents.length} agenda`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDayClick(day);
                  }}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    today
                      ? "bg-primary-500 text-white"
                      : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {format(day, "d")}
                </button>
              </div>

              {/* Event badges */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, MAX_VISIBLE).map((event) => (
                  <EventBadge
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                    compact
                  />
                ))}
                {overflow > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayClick(day);
                    }}
                    className="w-full rounded px-1.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    +{overflow} lainnya
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
