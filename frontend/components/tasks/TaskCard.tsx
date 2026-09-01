"use client";

import { format, isPast, parseISO } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, FamilyMember } from "@/types";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Circle,
    classes: "text-neutral-400",
    badge: "bg-neutral-100 text-neutral-600",
  },
  in_progress: {
    label: "Berjalan",
    icon: Loader2,
    classes: "text-info-500",
    badge: "bg-info-50 text-info-600",
  },
  done: {
    label: "Selesai",
    icon: CheckCircle2,
    classes: "text-success-600",
    badge: "bg-success-50 text-success-600",
  },
} as const;

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
  const cfg = STATUS_CONFIG[task.status];
  const StatusIcon = cfg.icon;

  const assignee = members.find((m) => m.id === task.assigned_to);
  const isDone = task.status === "done";

  const isOverdue =
    task.due_date &&
    !isDone &&
    isPast(parseISO(task.due_date + "T23:59:59"));

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border bg-white p-4 transition-shadow hover:shadow-sm",
        isDone ? "border-neutral-100 opacity-60" : "border-neutral-200"
      )}
    >
      {/* Complete button */}
      <button
        onClick={() => !isDone && onComplete(task)}
        disabled={isDone || isCompleting}
        className={cn(
          "mt-0.5 flex-shrink-0 rounded-full transition-colors focus:outline-none",
          isDone
            ? "cursor-default text-success-500"
            : "text-neutral-300 hover:text-primary-500"
        )}
        aria-label="Tandai selesai"
      >
        {isCompleting ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
        ) : (
          <StatusIcon className="h-5 w-5" />
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold text-neutral-900",
            isDone && "line-through text-neutral-400"
          )}
        >
          {task.title}
        </p>

        {task.description && (
          <p className="mt-0.5 text-xs text-neutral-500 truncate">
            {task.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Status badge */}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              cfg.badge
            )}
          >
            {cfg.label}
          </span>

          {/* Poin */}
          {task.points > 0 && (
            <span className="inline-flex items-center rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-600">
              ⭐ {task.points} poin
            </span>
          )}

          {/* Assignee */}
          {assignee && (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
              <span
                className="inline-block h-4 w-4 rounded-full text-center text-[10px] font-bold leading-4 text-white"
                style={{ backgroundColor: `var(--member-color, #14b8a6)` }}
              >
                {assignee.name[0].toUpperCase()}
              </span>
              {assignee.name}
            </span>
          )}

          {/* Due date */}
          {task.due_date && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                isOverdue ? "font-semibold text-error-600" : "text-neutral-400"
              )}
            >
              <Clock className="h-3 w-3" />
              {format(parseISO(task.due_date), "d MMM", { locale: dateLocale })}
              {isOverdue && " (terlambat)"}
            </span>
          )}
        </div>
      </div>

      {/* Actions — visible on hover */}
      {!isDone && (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(task)}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="rounded p-1 text-neutral-400 hover:bg-error-50 hover:text-error-600 transition-colors"
            aria-label="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
