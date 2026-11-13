"use client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Check,
  Clock3,
  Loader2,
  Pencil,
  Play,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { dateKey, localDateKey } from "@/lib/dashboard";
import type { Task, FamilyMember, TaskStatus } from "@/types";
interface TaskCardProps {
  task: Task;
  members: FamilyMember[];
  onEdit: (task: Task) => void;
  onComplete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
  isBusy?: boolean;
  isWorking?: boolean;
}
export function TaskCard({
  task,
  members,
  onEdit,
  onComplete,
  onStatusChange,
  onDelete,
  isBusy,
  isWorking,
}: TaskCardProps) {
  const due = dateKey(task.due_date),
    today = localDateKey(new Date());
  const done = task.status === "done",
    overdue = !done && due !== null && due < today;
  const member = members.find((item) => item.id === task.assigned_to);
  return (
    <article
      className={`task-card ${overdue ? "is-overdue" : ""} ${done ? "is-done" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() =>
            done ? onStatusChange(task, "pending") : onComplete(task)
          }
          disabled={isBusy}
          aria-label={
            done ? `Buka kembali ${task.title}` : `Selesaikan ${task.title}`
          }
          aria-pressed={done}
          className="task-check-hit"
        >
          <span className="task-check">
            {isWorking ? (
              <Loader2 size={12} className="animate-spin" />
            ) : done ? (
              <Check size={12} />
            ) : null}
          </span>
        </button>
        <button
          disabled={isBusy}
          onClick={() => onEdit(task)}
          className="task-title"
        >
          {task.title}
        </button>
      </div>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      <div className="task-meta">
        <span className={`task-due ${overdue ? "is-overdue" : ""}`}>
          <Clock3 size={12} />
          {due
            ? `${due === today ? "Hari ini" : format(new Date(`${due}T12:00:00`), "d MMM", { locale: id })}${overdue ? " · Terlambat" : ""}`
            : "Tanpa tenggat"}
        </span>
        {task.points > 0 && (
          <span className="task-points">
            <Star size={11} />
            {task.points} poin
          </span>
        )}
      </div>
      <div className="task-card-footer">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="task-member-initial">
            {(member?.name ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {member?.name ??
              (task.assigned_to ? "Anggota keluarga" : "Belum dibagikan")}
          </span>
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          {task.status !== "in_progress" && (
            <button
              disabled={isBusy}
              onClick={() =>
                onStatusChange(task, done ? "pending" : "in_progress")
              }
              aria-label={`${done ? "Buka kembali" : "Mulai"} ${task.title}`}
              className="task-icon-button"
            >
              {done ? <RotateCcw size={13} /> : <Play size={13} />}
            </button>
          )}
          <button
            disabled={isBusy}
            onClick={() => onEdit(task)}
            aria-label={`Edit ${task.title}`}
            className="task-icon-button"
          >
            <Pencil size={13} />
          </button>
          <button
            disabled={isBusy}
            onClick={() => onDelete(task)}
            aria-label={`Hapus ${task.title}`}
            className="task-icon-button is-delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}
