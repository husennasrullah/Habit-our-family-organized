"use client";

import { ModalFrame } from "@/components/shared/ModalFrame";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { dateKey } from "@/lib/dashboard";
import type { Task, FamilyMember, TaskStatus } from "@/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const taskSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  points: z.coerce
    .number()
    .int("Poin harus bilangan bulat")
    .min(0, "Poin tidak boleh negatif")
    .max(1000, "Poin maksimal 1000"),
  status: z.enum(["pending", "in_progress", "done"]),
  due_date: z
    .string()
    .refine(
      (value) => !value || dateKey(value) === value,
      "Tanggal tenggat tidak valid",
    )
    .optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: TaskFormValues) => void;
  onDelete?: () => void;
  task?: Task | null;
  members: FamilyMember[];
  isSaving?: boolean;
  isDeleting?: boolean;
  initialStatus?: TaskStatus;
  membersUnavailable?: boolean;
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  members,
  isSaving,
  isDeleting,
  initialStatus = "pending",
  membersUnavailable,
}: TaskModalProps) {
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      assigned_to: "",
      points: 0,
      status: initialStatus,
      due_date: "",
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        assigned_to: task.assigned_to ?? "",
        points: task.points,
        status: task.status,
        due_date: dateKey(task.due_date) ?? "",
      });
    } else {
      reset({
        title: "",
        description: "",
        assigned_to: "",
        points: 0,
        status: initialStatus,
        due_date: "",
      });
    }
  }, [task, reset, isOpen, initialStatus]);

  if (!isOpen) return null;

  return (
    <ModalFrame
      className="task-dialog fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClose={() => !isSaving && !isDeleting && onClose()}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !isSaving && !isDeleting && onClose()}
      />

      <div className="relative z-10 w-full sm:max-w-sm bg-card rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {isEditing ? "Edit Tugas" : "Tambah Tugas"}
          </h2>
          <button
            onClick={() => !isSaving && !isDeleting && onClose()}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="task-form"
          onSubmit={handleSubmit(onSave)}
          className="px-4 py-4 space-y-4 max-h-[65vh] overflow-y-auto"
        >
          <fieldset disabled={isSaving || isDeleting} className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <Label htmlFor="task-title">Judul *</Label>
              <Input
                id="task-title"
                placeholder="Nama tugas"
                {...register("title")}
                className={cn(errors.title && "border-error-500")}
              />
              {errors.title && (
                <p className="text-xs text-error-500">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="task-desc">Deskripsi</Label>
              <textarea
                id="task-desc"
                rows={2}
                placeholder="Opsional"
                {...register("description")}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm placeholder-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 resize-none"
              />
            </div>

            {/* Assign + Points */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="task-assign">Ditugaskan ke</Label>
                <select
                  id="task-assign"
                  {...register("assigned_to")}
                  disabled={membersUnavailable || isSaving || isDeleting}
                  className="w-full rounded-md border border-neutral-300 bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                >
                  <option value="">Belum dibagikan</option>
                  {task?.assigned_to &&
                    !members.some((m) => m.id === task.assigned_to) && (
                      <option value={task.assigned_to}>Anggota saat ini</option>
                    )}
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-points">Poin</Label>
                <Input
                  id="task-points"
                  type="number"
                  min={0}
                  max={1000}
                  {...register("points")}
                />
              </div>
            </div>

            {errors.points && (
              <p
                role="alert"
                className="text-xs text-red-600 dark:text-red-300"
              >
                {errors.points.message}
              </p>
            )}
            {membersUnavailable && (
              <p className="text-xs text-muted-foreground">
                Daftar anggota belum tersedia. Penanggung jawab tetap
                dipertahankan.
              </p>
            )}
            {/* Status + Due date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="task-status">Status</Label>
                <select
                  id="task-status"
                  {...register("status")}
                  className="w-full rounded-md border border-neutral-300 bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                >
                  <option value="pending">Belum dimulai</option>
                  <option value="in_progress">Berjalan</option>
                  <option value="done">Selesai</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-due">Tenggat</Label>
                <Input id="task-due" type="date" {...register("due_date")} />
              </div>
            </div>
            {errors.due_date && (
              <p
                role="alert"
                className="text-xs text-red-600 dark:text-red-300"
              >
                {errors.due_date.message}
              </p>
            )}
          </fieldset>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-4">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting || isSaving}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Hapus
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => !isSaving && !isDeleting && onClose()}
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="task-form"
              disabled={isSaving || isDeleting}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {isEditing ? "Simpan" : "Buat Tugas"}
            </Button>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}
