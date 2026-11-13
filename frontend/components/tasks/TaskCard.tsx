"use client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { dateKey, localDateKey } from "@/lib/dashboard";
import type { Task, FamilyMember } from "@/types";
interface TaskCardProps {
  task: Task;
  members: FamilyMember[];
  onEdit: (task: Task) => void;
  onComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
  isCompleting?: boolean;
}
export function TaskCard({
  task,
  members,
  onEdit,
  onComplete,
  onDelete,
  isCompleting,
}: TaskCardProps) {
  const due = dateKey(task.due_date);
  const done = task.status === "done";
  const overdue = !done && due !== null && due < localDateKey(new Date());
  const member = members.find((item) => item.id === task.assigned_to);
  return (
    <article
      className={`min-w-0 rounded-2xl border bg-card p-4 ${overdue ? "border-red-200 dark:border-red-900" : "border-border"}`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => onComplete(task)}
          disabled={done || isCompleting}
          aria-label={`Selesaikan ${task.title}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-primary-600 hover:bg-muted dark:text-primary-200 disabled:opacity-60"
        >
          {isCompleting ? (
            <Loader2 size={19} className="animate-spin" />
          ) : done ? (
            <CheckCircle2 size={19} />
          ) : (
            <Check size={19} />
          )}
        </button>
        <button
          onClick={() => onEdit(task)}
          className={`min-w-0 flex-1 break-words py-2 text-left text-sm font-semibold ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {task.title}
        </button>
      </div>
      {task.description && (
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
          {task.description}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${overdue ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200" : "bg-muted text-muted-foreground"}`}
        >
          <Clock3 size={13} />
          {due
            ? `${format(new Date(`${due}T12:00:00`), "d MMM", { locale: id })}${overdue ? " · Terlambat" : ""}`
            : "Belum dijadwalkan"}
        </span>
        {task.points > 0 && (
          <span className="rounded-lg bg-muted px-2 py-1">
            {task.points} poin
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {member?.name ?? "Belum dibagikan"}
        </span>
        <div className="flex shrink-0">
          <button
            onClick={() => onEdit(task)}
            aria-label={`Edit ${task.title}`}
            className="flex w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(task)}
            aria-label={`Hapus ${task.title}`}
            className="flex w-11 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
