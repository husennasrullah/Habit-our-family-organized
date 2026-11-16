import { dateKey, localDateKey } from "./dashboard";
import type { Task } from "@/types";
export type DueFilter = "all" | "today" | "overdue" | "week" | "none";
export function taskOverview(tasks: Task[], now = new Date()) {
  const today = localDateKey(now);
  return {
    active: tasks.filter((t) => t.status !== "done").length,
    today: tasks.filter(
      (t) => t.status !== "done" && dateKey(t.due_date) === today,
    ).length,
    overdue: tasks.filter(
      (t) =>
        t.status !== "done" &&
        !!dateKey(t.due_date) &&
        dateKey(t.due_date)! < today,
    ).length,
    done: tasks.filter((t) => t.status === "done").length,
  };
}
export function filterTasks(
  tasks: Task[],
  filters: { search: string; member: string; due: DueFilter },
  now = new Date(),
) {
  const today = localDateKey(now),
    end = new Date(`${today}T12:00:00Z`);
  const weekday = (end.getUTCDay() + 6) % 7;
  end.setUTCDate(end.getUTCDate() + 6 - weekday);
  const weekEnd = end.toISOString().slice(0, 10);
  const query = filters.search.trim().toLocaleLowerCase("id-ID");
  return tasks.filter((task) => {
    if (
      query &&
      !`${task.title} ${task.description ?? ""}`
        .toLocaleLowerCase("id-ID")
        .includes(query)
    )
      return false;
    if (
      filters.member === "unassigned"
        ? task.assigned_to !== null
        : filters.member && task.assigned_to !== filters.member
    )
      return false;
    const due = dateKey(task.due_date);
    if (filters.due === "none") return due === null;
    if (filters.due === "today") return due === today;
    if (filters.due === "overdue")
      return task.status !== "done" && due !== null && due < today;
    if (filters.due === "week")
      return due !== null && due >= today && due <= weekEnd;
    return true;
  });
}
