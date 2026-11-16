import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { calendarHref } from "@/lib/calendarSources";
import type { ReactNode } from "react";
export function CalendarDateLink({
  date,
  source,
  children,
}: {
  date: string;
  source: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={calendarHref(date, source)}
      className="calendar-date-link"
      aria-label={`Lihat ${date.slice(0, 10)} di kalender`}
    >
      <CalendarDays size={12} aria-hidden="true" />
      <span>{children}</span>
    </Link>
  );
}
