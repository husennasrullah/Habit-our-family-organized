"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Task, FamilyMember } from "@/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const taskSchema = z.object({
  title:       z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  points:      z.coerce.number().min(0).max(1000),
  status:      z.enum(["pending", "in_progress", "done"]),
  due_date:    z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  onSave:      (values: TaskFormValues) => void;
  onDelete?:   () => void;
  task?:       Task | null;
  members:     FamilyMember[];
  isSaving?:   boolean;
  isDeleting?: boolean;
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
      title:       "",
      description: "",
      assigned_to: "",
      points:      0,
      status:      "pending",
      due_date:    "",
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title:       task.title,
        description: task.description ?? "",
        assigned_to: task.assigned_to ?? "",
        points:      task.points,
        status:      task.status,
        due_date:    task.due_date ?? "",
      });
    } else {
      reset({
        title: "", description: "", assigned_to: "",
        points: 0, status: "pending", due_date: "",
      });
    }
  }, [task, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEditing ? "Edit Tugas" : "Tambah Tugas"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="task-form"
          onSubmit={handleSubmit(onSave)}
          className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto"
        >
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
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              >
                <option value="">Siapapun</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
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

          {/* Status + Due date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="task-status">Status</Label>
              <select
                id="task-status"
                {...register("status")}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">Berjalan</option>
                <option value="done">Selesai</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task-due">Tenggat</Label>
              <Input
                id="task-due"
                type="date"
                {...register("due_date")}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Hapus
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button
              type="submit"
              form="task-form"
              disabled={isSaving}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {isEditing ? "Simpan" : "Buat Tugas"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
