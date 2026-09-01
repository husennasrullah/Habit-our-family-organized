"use client";

import { cn } from "@/lib/utils";
import { getColor } from "@/lib/calendarUtils";
import type { CalendarEvent } from "@/types";

interface EventBadgeProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  compact?: boolean; // for month grid cells with limited space
}

export function EventBadge({ event, onClick, compact = false }: EventBadgeProps) {
  const { bg, text } = getColor(event.color);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      title={event.title}
      className={cn(
        "w-full truncate rounded px-1.5 text-left font-medium transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        compact ? "py-0 text-xs leading-5" : "py-0.5 text-xs",
        bg,
        text
      )}
    >
      {!event.is_all_day && !compact && (
        <span className="mr-1 opacity-70">
          {new Date(event.start_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
      {event.title}
    </button>
  );
}

/** A small colored dot used in week/day headers to indicate events */
export function EventDot({ color }: { color: string }) {
  const { dot } = getColor(color);
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dot)} />;
}
