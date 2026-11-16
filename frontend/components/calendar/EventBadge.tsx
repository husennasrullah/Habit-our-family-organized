"use client";

import { cn } from "@/lib/utils";
import { getColor } from "@/lib/calendarUtils";
import type { CalendarEvent } from "@/types";
interface EventBadgeProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  compact?: boolean;
}
export function EventBadge({
  event,
  onClick,
  compact = false,
}: EventBadgeProps) {
  const { bg, text, dot } = getColor(event.color);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      title={event.title}
      className={cn("calendar-event-badge", compact && "is-compact", bg, text)}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      {!event.is_all_day && (
        <span className="calendar-event-time">
          {new Date(event.start_at)
            .toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Jakarta",
              hour12: false,
            })
            .replace(".", ":")}
        </span>
      )}
      <span className="min-w-0 truncate">{event.title}</span>
    </button>
  );
}
export function EventDot({ color }: { color: string }) {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        getColor(color).dot,
      )}
    />
  );
}
