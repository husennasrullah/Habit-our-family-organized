import type { Budget, CalendarEvent, Task } from "../types";

/** Date columns are calendar dates, even when the API appends a UTC timestamp. */
export function dateKey(value: string | null | undefined): string | null {
  const key = value?.slice(0, 10);
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const parsed = new Date(`${key}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === key
    ? key
    : null;
}

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dayRange(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end, from: start.toISOString(), to: end.toISOString() };
}

export function groupTasks(tasks: Task[], now: Date) {
  const today = localDateKey(now);
  const open = tasks.filter((task) => task.status !== "done");
  return {
    today: open.filter((task) => dateKey(task.due_date) === today),
    overdue: open
      .filter((task) => {
        const due = dateKey(task.due_date);
        return due !== null && due < today;
      })
      .sort((a, b) => dateKey(a.due_date)!.localeCompare(dateKey(b.due_date)!)),
    unscheduled: open.filter((task) => dateKey(task.due_date) === null),
  };
}

export function eventsForDay(events: CalendarEvent[], now: Date) {
  const { start, end } = dayRange(now);
  return events
    .filter((event) => {
      const from = new Date(event.start_at).getTime();
      const to = new Date(event.end_at).getTime();
      // End is exclusive; an event ending at midnight belongs to the preceding day.
      return (
        Number.isFinite(from) &&
        Number.isFinite(to) &&
        to >= from &&
        from < end.getTime() &&
        (to > start.getTime() || (from === to && from >= start.getTime()))
      );
    })
    .sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    );
}

export function budgetOverview(
  budgets: Budget[],
  spent: number,
  month: number,
  year: number,
) {
  const total = budgets
    .filter((budget) => budget.month === month && budget.year === year)
    .reduce((sum, budget) => sum + budget.amount, 0);
  const hasBudget = total > 0;
  const percentage = hasBudget ? Math.round((spent / total) * 100) : null;
  return {
    total,
    spent,
    hasBudget,
    remaining: hasBudget ? total - spent : null,
    percentage,
    barPercentage:
      percentage === null ? 0 : Math.max(0, Math.min(100, percentage)),
  };
}
