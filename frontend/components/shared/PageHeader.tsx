import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { MENU_CALENDAR_SOURCES, calendarHref } from "@/lib/calendarSources";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
  calendarDate,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  calendarDate?: string;
}) {
  return (
    <div className="page-header flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {(action || MENU_CALENDAR_SOURCES[title]) && (
        <div className="page-header-actions flex shrink-0 flex-wrap items-center gap-2">
          {MENU_CALENDAR_SOURCES[title] && (
            <Link
              href={calendarHref(calendarDate, MENU_CALENDAR_SOURCES[title])}
              className="page-calendar-link"
            >
              <CalendarDays size={15} />
              Lihat kalender
            </Link>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
