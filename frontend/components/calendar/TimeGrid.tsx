"use client";

import { useEffect, useRef } from "react";
import { format, isToday } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  getEventsForDay,
  getColor,
  layoutDayEvents,
} from "@/lib/calendarUtils";
import { EventBadge } from "./EventBadge";
import type { CalendarEvent } from "@/types";

interface TimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
}
const HOURS = Array.from({ length: 24 }, (_, i) => i);
export function TimeGrid({
  days,
  events,
  onEventClick,
  onSlotClick,
}: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isWeek = days.length > 1;
  const dateKey = format(days[0], "yyyy-MM-dd");
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * 60;
  }, [dateKey]);
  const columns = {
    gridTemplateColumns: `48px repeat(${days.length}, minmax(0, 1fr))`,
  };
  return (
    <div className="calendar-time-card">
      <div
        className="calendar-time-scroll"
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label={
          isWeek
            ? "Jadwal mingguan, geser untuk melihat jam dan hari"
            : "Jadwal harian, geser untuk melihat jam"
        }
      >
        <div className={cn("calendar-time-inner", isWeek && "is-week")}>
          <div className="calendar-time-head" style={columns}>
            <div className="calendar-time-zone">
              GMT{new Date().getTimezoneOffset() <= 0 ? "+" : "−"}
              {Math.abs(new Date().getTimezoneOffset() / 60)}
            </div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "calendar-time-day",
                  isToday(day) && "is-today-column",
                )}
              >
                <span className="text-xs text-muted-foreground">
                  {format(day, isWeek ? "EEE" : "EEEE", { locale: id })}
                </span>
                <span
                  className={cn(
                    "calendar-time-date",
                    isToday(day) && "is-today",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
            ))}
            <div className="calendar-all-day-label">Seharian</div>
            {days.map((day) => (
              <div key={day.toISOString()} className="calendar-all-day-events">
                {getEventsForDay(events, day)
                  .filter((e) => e.is_all_day)
                  .map((event) => (
                    <EventBadge
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      compact
                    />
                  ))}
              </div>
            ))}
          </div>
          <div className="grid" style={columns}>
            <div>
              {HOURS.map((hour) => (
                <div key={hour} className="calendar-hour-label">
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>
            {days.map((day) => {
              const blocks = layoutDayEvents(events, day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "calendar-time-column",
                    isToday(day) && "is-today-column",
                  )}
                >
                  {HOURS.map((hour) => (
                    <button
                      key={hour}
                      className="calendar-time-slot"
                      aria-label={`Buat acara ${format(day, "d MMMM", { locale: id })} pukul ${String(hour).padStart(2, "0")}:00`}
                      onClick={() => {
                        const date = new Date(day);
                        date.setHours(hour, 0, 0, 0);
                        onSlotClick(date);
                      }}
                    />
                  ))}
                  {blocks.map(
                    ({ event, startMinute, endMinute, lane, lanes }) => {
                      const color = getColor(event.color);
                      return (
                        <button
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          title={event.title}
                          className={cn(
                            "calendar-time-event",
                            color.bg,
                            color.text,
                          )}
                          style={{
                            top: startMinute,
                            height: Math.max(endMinute - startMinute, 28),
                            left: `calc(${(lane / lanes) * 100}% + 3px)`,
                            width: `calc(${100 / lanes}% - 6px)`,
                          }}
                        >
                          <span className="block truncate font-semibold">
                            {event.title}
                          </span>
                          <span className="mt-1 block text-[10px] opacity-80">
                            {format(new Date(event.start_at), "HH:mm")} –{" "}
                            {format(new Date(event.end_at), "HH:mm")}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="calendar-month-footer">
        <span>
          {isWeek
            ? "7 hari, satu rencana bersama"
            : "Satu hari untuk hal yang berarti"}
        </span>
        <span>Pilih jam kosong untuk membuat acara</span>
      </div>
    </div>
  );
}
