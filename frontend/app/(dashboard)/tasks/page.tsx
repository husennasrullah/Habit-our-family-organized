"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal, type TaskFormValues } from "@/components/tasks/TaskModal";
import { Leaderboard } from "@/components/tasks/Leaderboard";
import { QueryError } from "@/components/shared/QueryError";
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
  { status: "pending", label: "Akan Datang", countKey: "pending" },
  { status: "in_progress", label: "Sedang Berjalan", countKey: "in_progress" },
  { status: "done", label: "Selesai", countKey: "done" },
] as const;

type ColStatus = (typeof COLUMNS)[number]["status"];

export default function TasksPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const familyId = user?.family_id;

  const [memberFilter, setMemberFilter] = useState("");
  const [mobileStatus, setMobileStatus] = useState<ColStatus>("pending");
  const tasksQuery = useTasks();
  const { data: leaderboard = [] } = useLeaderboard();
  const filteredTasks = (tasksQuery.data ?? []).filter(
    (task) => !memberFilter || task.assigned_to === memberFilter,
  );
  const tasksByStatus: Record<ColStatus, Task[]> = {
    pending: filteredTasks.filter((task) => task.status === "pending"),
    in_progress: filteredTasks.filter((task) => task.status === "in_progress"),
    done: filteredTasks.filter((task) => task.status === "done"),
  };

  const { data: members = [] } = useQuery({
    queryKey: ["family-members", familyId],
    queryFn: async () => {
      const { data } =
        await api.get<ApiResponse<FamilyMember[]>>("/family/members");
      return data.data ?? [];
    },
    enabled: !!familyId,
    staleTime: 60_000,
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();

  const handleAdd = useCallback(() => {
    setSelectedTask(null);
    setModalOpen(true);
  }, []);
  const handleEdit = useCallback((task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  }, []);

  const handleComplete = useCallback(
    async (task: Task) => {
      setCompletingId(task.id);
      try {
        await completeTask.mutateAsync(task.id);
        toast.success(`"${task.title}" selesai! 🎉`);
      } catch {
        toast.error("Gagal menyelesaikan tugas");
      } finally {
        setCompletingId(null);
      }
    },
    [completeTask],
  );

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Hapus tugas "${task.title}"?`)) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Tugas dihapus");
      setModalOpen(false);
    } catch {
      toast.error("Gagal menghapus tugas");
    }
  };

  const handleSave = async (values: TaskFormValues) => {
    const payload = {
      ...values,
      assigned_to: values.assigned_to || null,
      due_date: values.due_date || null,
    };
    try {
      if (selectedTask) {
        await updateTask.mutateAsync({ id: selectedTask.id, ...payload });
        toast.success("Tugas diperbarui");
      } else {
        await createTask.mutateAsync(payload);
        toast.success("Tugas dibuat");
      }
      setModalOpen(false);
    } catch {
      toast.error("Gagal menyimpan tugas");
    }
  };

  const isLoading = tasksQuery.isPending;

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <PageHeader
        title="Tugas"
        description="Bagi tugas, ringankan hari. Selesaikan bersama keluarga."
        action={
          <>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah Tugas
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <label htmlFor="task-member" className="text-sm font-medium">
          Tugas untuk
        </label>
        <select
          id="task-member"
          value={memberFilter}
          onChange={(event) => setMemberFilter(event.target.value)}
          className="min-w-0 rounded-xl border border-border px-3 text-sm"
        >
          <option value="">Semua anggota</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <div className="flex w-full gap-1 md:hidden">
          {COLUMNS.map(({ status, label }) => (
            <button
              key={status}
              onClick={() => setMobileStatus(status)}
              aria-pressed={mobileStatus === status}
              className={cn(
                "min-w-0 flex-1 rounded-xl px-2 text-xs font-medium",
                mobileStatus === status
                  ? "bg-primary-50 text-primary-800 dark:bg-primary-900 dark:text-primary-100"
                  : "text-muted-foreground",
              )}
            >
              {label} ({tasksByStatus[status].length})
            </button>
          ))}
        </div>
      </div>
      {tasksQuery.isError ? (
        <QueryError retry={() => void tasksQuery.refetch()} />
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-4">
          <div className="grid min-w-0 gap-4 md:grid-cols-3 xl:col-span-3">
            {COLUMNS.map(({ status, label }) => (
              <section
                key={status}
                className={cn(
                  "min-w-0 space-y-3",
                  mobileStatus !== status && "hidden md:block",
                )}
              >
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold">{label}</h2>
                  <span className="rounded-lg bg-muted px-2 py-1 text-xs">
                    {tasksByStatus[status].length}
                  </span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-40 rounded-2xl" />
                ) : tasksByStatus[status].length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    Belum ada tugas di sini.
                  </div>
                ) : (
                  tasksByStatus[status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      members={members}
                      onEdit={handleEdit}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                      isCompleting={completingId === task.id}
                    />
                  ))
                )}
              </section>
            ))}
          </div>
          <Leaderboard entries={leaderboard} members={members} />
        </div>
      )}

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
