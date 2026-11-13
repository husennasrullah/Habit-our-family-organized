"use client";
import { TimeGrid } from "./TimeGrid";
import type { CalendarEvent } from "@/types";
interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (date: Date) => void;
}
export function DayView({ currentDate, ...props }: DayViewProps) {
  return <TimeGrid days={[currentDate]} {...props} />;
}
