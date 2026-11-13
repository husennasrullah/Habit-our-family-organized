"use client";
import { TimeGrid } from "./TimeGrid";
import { getWeekDays } from "@/lib/calendarUtils";
import type { CalendarEvent } from "@/types";
interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
}
export function WeekView({ currentDate, ...props }: WeekViewProps) {
  return <TimeGrid days={getWeekDays(currentDate)} {...props} />;
}
