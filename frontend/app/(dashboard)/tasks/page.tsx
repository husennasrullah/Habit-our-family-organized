"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal, type TaskFormValues } from "@/components/tasks/TaskModal";
import { Leaderboard } from "@/components/tasks/Leaderboard";
import { cn } from "@/lib/utils";
import {
  useTasks,
  useLeaderboard,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useDeleteTask,
} from "@/hooks/useTasks";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { Task, FamilyMember, ApiResponse } from "@/types";

// ─── Kolom kanban ─────────────────────────────────────────────────────────────
const COLUMNS = [
  { status: "pending",     label: "Akan Datang",    countKey: "pending"      },
  { status: "in_progress", label: "Sedang Berjalan", countKey: "in_progress" },
  { status: "done",        label: "Selesai",         countKey: "done"        },
] as const;

type ColStatus = typeof COLUMNS[number]["status"];

// Badge warna per kategori tugas
const CATEGORY_COLORS: Record<string, string> = {
  belanja:   "bg-orange-100 text-orange-700",
  kesehatan: "bg-teal-100 text-teal-700",
  keuangan:  "bg-blue-100 text-blue-700",
  rumah:     "bg-emerald-100 text-emerald-700",
  sekolah:   "bg-purple-100 text-purple-700",
};
function getCategoryStyle(title: string) {
  const lower = title.toLowerCase();
  for (const [key, cls] of Object.entries(CATEGORY_COLORS)) {
    if (lower.includes(key)) return { cls, label: key.charAt(0).toUpperCase() + key.slice(1) };
  }
  return { cls: "bg-neutral-100 text-neutral-500", label: "Lainnya" };
}

export default function TasksPage() {
  const [modalOpen, setModalOpen]       = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const user     = useAuthStore((s) => s.user);
  const familyId = user?.family_id;

  // Data per kolom
  const { data: pendingTasks    = [], isLoading: pLoading } = useTasks({ status: "pending" });
  const { data: inProgressTasks = [], isLoading: iLoading } = useTasks({ status: "in_progress" });
  const { data: doneTasks       = [], isLoading: dLoading } = useTasks({ status: "done" });
  const { data: leaderboard     = [] } = useLeaderboard();

  const tasksByStatus: Record<ColStatus, Task[]> = {
    pending:     pendingTasks,
    in_progress: inProgressTasks,
    done:        doneTasks,
  };

  const { data: members = [] } = useQuery({
    queryKey: ["family-members", familyId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FamilyMember[]>>("/family/members");
      return data.data ?? [];
    },
    enabled: !!familyId,
    staleTime: 60_000,
  });

  const createTask   = useCreateTask();
  const updateTask   = useUpdateTask();
  const completeTask = useCompleteTask();
  const deleteTask   = useDeleteTask();

  const handleAdd  = useCallback(() => { setSelectedTask(null); setModalOpen(true); }, []);
  const handleEdit = useCallback((task: Task) => { setSelectedTask(task); setModalOpen(true); }, []);

  const handleComplete = useCallback(async (task: Task) => {
    setCompletingId(task.id);
    try {
      await completeTask.mutateAsync(task.id);
      toast.success(`"${task.title}" selesai! 🎉`);
    } catch { toast.error("Gagal menyelesaikan tugas"); }
    finally { setCompletingId(null); }
  }, [completeTask]);

  const handleDelete = async (task: Task) => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Tugas dihapus");
      setModalOpen(false);
    } catch { toast.error("Gagal menghapus tugas"); }
  };

  const handleSave = async (values: TaskFormValues) => {
    const payload = { ...values, assigned_to: values.assigned_to || null, due_date: values.due_date || null };
    try {
      if (selectedTask) {
        await updateTask.mutateAsync({ id: selectedTask.id, ...payload });
        toast.success("Tugas diperbarui");
      } else {
        await createTask.mutateAsync(payload);
        toast.success("Tugas dibuat");
      }
      setModalOpen(false);
    } catch { toast.error("Gagal menyimpan tugas"); }
  };

  const isLoading = pLoading || iLoading || dLoading;

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tugas &amp; Kegiatan</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Kelola daftar belanja, pekerjaan rumah, dan agenda penting keluarga.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Tambah Tugas
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* ── Kanban 3 kolom ──────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {COLUMNS.map(({ status, label }) => {
              const tasks = tasksByStatus[status];
              const count = tasks.length;
              const colBadge = status === "pending"
                ? "bg-neutral-200 text-neutral-600"
                : status === "in_progress"
                ? "bg-teal-100 text-teal-700"
                : "bg-neutral-200 text-neutral-500";

              return (
                <div key={status} className="flex flex-col gap-3">
                  {/* Kolom header */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                      {label}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${colBadge}`}>
                      {count}
                    </span>
                  </div>

                  {/* Cards */}
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 rounded-xl" />
                    ))
                  ) : tasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-200 bg-white/60 py-8 text-center">
                      <p className="text-xs text-neutral-400">Tidak ada tugas</p>
                    </div>
                  ) : (
                    tasks.map((task) => {
                      const { cls, label: catLabel } = getCategoryStyle(task.title);
                      const isDone = task.status === "done";
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleEdit(task)}
                          className={cn(
                            "rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
                            status === "in_progress" ? "border-l-4 border-l-primary-500 border-neutral-100 dark:border-neutral-800" : "border-neutral-100 dark:border-neutral-800"
                          )}
                        >
                          {/* Kategori badge */}
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide mb-2 ${cls}`}>
                            {catLabel}
                          </span>

                          {/* Judul */}
                          <p className={cn(
                            "text-sm font-semibold text-neutral-800 dark:text-neutral-100 leading-snug",
                            isDone && "line-through text-neutral-400"
                          )}>
                            {task.title}
                          </p>

                          {/* Meta */}
                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                              {task.due_date && (
                                <>
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v4l2.5 1.5" strokeLinecap="round"/>
                                  </svg>
                                  <span>{
                                    isDone ? "Selesai" :
                                    task.due_date === new Date().toISOString().slice(0, 10) ? "Hari ini" :
                                    `Besok` /* simplified */
                                  }</span>
                                </>
                              )}
                            </div>
                            {/* Assignee avatar */}
                            {task.assigned_to && (() => {
                              const m = members.find(mb => mb.id === task.assigned_to);
                              return m ? (
                                <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-700">
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                              ) : null;
                            })()}
                          </div>

                          {/* Progress bar untuk in_progress */}
                          {status === "in_progress" && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                                <span>Progress</span>
                                <span>60%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-700">
                                <div className="h-1.5 w-[60%] rounded-full bg-primary-500" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Leaderboard ─────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <Leaderboard entries={leaderboard} members={members} />
        </div>
      </div>

      {/* Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={selectedTask ? () => handleDelete(selectedTask) : undefined}
        task={selectedTask}
        members={members}
        isSaving={createTask.isPending || updateTask.isPending}
        isDeleting={deleteTask.isPending}
      />
    </div>
  );
}
