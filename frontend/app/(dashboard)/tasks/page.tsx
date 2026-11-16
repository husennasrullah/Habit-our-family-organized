"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ListTodo,
  Clock3,
  CircleCheck,
  TriangleAlert,
} from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useCalendarContext } from "@/hooks/useCalendarContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryError } from "@/components/shared/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal, type TaskFormValues } from "@/components/tasks/TaskModal";
import { Leaderboard } from "@/components/tasks/Leaderboard";
import {
  useTasks,
  useLeaderboard,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useDeleteTask,
} from "@/hooks/useTasks";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { taskOverview, filterTasks, type DueFilter } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
const COLUMNS = [
  { status: "pending", label: "Belum dimulai", className: "is-pending" },
  { status: "in_progress", label: "Dikerjakan", className: "is-progress" },
  { status: "done", label: "Selesai", className: "is-done" },
] as const;
function errorMessage(error: unknown) {
  return isAxiosError(error) &&
    typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : "Perubahan belum tersimpan. Coba lagi.";
}
export default function TasksPage() {
  const context = useCalendarContext();
  const [dialog, setDialog] = useState<{
    task?: Task;
    status: TaskStatus;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [member, setMember] = useState("");
  const [due, setDue] = useState<DueFilter>("all");
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const tasksQuery = useTasks(),
    leaderboard = useLeaderboard(),
    membersQuery = useFamilyMembers();
  const create = useCreateTask(),
    update = useUpdateTask(),
    complete = useCompleteTask(),
    remove = useDeleteTask();
  const members = membersQuery.data ?? [],
    tasks = tasksQuery.data ?? [];
  useEffect(() => {
    const target = tasksQuery.data?.find((task) => task.id === context.record);
    if (target) setMobileStatus(target.status);
  }, [context.record, tasksQuery.data]);
  const unavailable = membersQuery.isPending || membersQuery.isError;
  const filtered = filterTasks(tasks, { search, member, due });
  const overview = taskOverview(tasks);
  const summary = [
    {
      label: "Tugas aktif",
      value: overview.active,
      icon: ListTodo,
      className: "is-active",
    },
    {
      label: "Tenggat hari ini",
      value: overview.today,
      icon: Clock3,
      className: "is-today",
    },
    {
      label: "Perlu perhatian",
      value: overview.overdue,
      icon: TriangleAlert,
      className: "is-overdue",
    },
    {
      label: "Sudah selesai",
      value: overview.done,
      icon: CircleCheck,
      className: "is-done",
    },
  ];
  const pending = create.isPending || update.isPending || remove.isPending;
  async function save(values: TaskFormValues) {
    if (pending) return;
    try {
      const payload = {
        ...values,
        assigned_to: unavailable
          ? (dialog?.task?.assigned_to ?? null)
          : values.assigned_to || null,
        due_date: values.due_date || null,
      };
      if (dialog?.task)
        await update.mutateAsync({ id: dialog.task.id, ...payload });
      else await create.mutateAsync(payload);
      setDialog(null);
      toast.success("Tugas disimpan");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }
  async function changeStatus(task: Task, status: TaskStatus) {
    if (busyId || pending) return;
    setBusyId(task.id);
    try {
      if (status === "done") await complete.mutateAsync(task.id);
      else await update.mutateAsync({ id: task.id, status });
      toast.success(
        status === "done"
          ? "Tugas selesai. Terima kasih sudah membantu!"
          : status === "pending"
            ? "Tugas dibuka kembali"
            : "Tugas mulai dikerjakan",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  }
  async function deleteTask(task: Task) {
    if (busyId || pending || !confirm(`Hapus tugas "${task.title}"?`)) return;
    setBusyId(task.id);
    try {
      await remove.mutateAsync(task.id);
      if (dialog?.task?.id === task.id) setDialog(null);
      toast.success("Tugas dihapus");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  }
  return (
    <div className="task-page w-full min-w-0 space-y-4">
      <PageHeader
        title="Tugas"
        description="Sedikit bantuan dari setiap orang, lebih banyak waktu bersama."
        action={
          <button
            onClick={() => setDialog({ status: "pending" })}
            className="task-add-button"
          >
            <Plus size={16} />
            Tambah tugas
          </button>
        }
      />
      <div
        className="task-summary"
        aria-label="Ringkasan seluruh tugas keluarga"
      >
        {summary.map(({ label, value, icon: Icon, className }) => (
          <div key={label} className="task-summary-card">
            <span className={cn("task-summary-icon", className)}>
              <Icon size={18} />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              {tasksQuery.isPending ? (
                <Skeleton className="mt-1 h-5 w-8" />
              ) : (
                <p className="mt-0.5 text-lg font-bold tabular-nums">
                  {tasksQuery.isError ? "—" : value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="task-toolbar">
        <label className="task-search">
          <Search size={16} className="shrink-0 text-muted-foreground" />
          <span className="sr-only">Cari tugas</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tugas keluarga…"
          />
        </label>
        <div className="task-filter-fields">
          <label className="sr-only" htmlFor="task-member">
            Tugas untuk
          </label>
          <select
            id="task-member"
            value={member}
            disabled={unavailable}
            onChange={(e) => setMember(e.target.value)}
          >
            <option value="">Semua anggota</option>
            <option value="unassigned">Belum dibagikan</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="task-due-filter">
            Filter tenggat
          </label>
          <select
            id="task-due-filter"
            value={due}
            onChange={(e) => setDue(e.target.value as DueFilter)}
          >
            <option value="all">Semua tenggat</option>
            <option value="today">Hari ini</option>
            <option value="overdue">Terlambat</option>
            <option value="week">Sisa minggu ini</option>
            <option value="none">Tanpa tenggat</option>
          </select>
        </div>
        {(search || member || due !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setMember("");
              setDue("all");
            }}
            className="task-reset"
          >
            Reset filter
          </button>
        )}
      </div>
      {membersQuery.isError && (
        <div className="task-inline-error" role="alert">
          Daftar anggota belum bisa dimuat.
          <button onClick={() => void membersQuery.refetch()}>Coba lagi</button>
        </div>
      )}
      <div className="task-workspace">
        <div className="min-w-0">
          <div className="task-board-caption">
            <span>
              {tasksQuery.isPending
                ? "Memuat tugas…"
                : tasksQuery.isError
                  ? "Tugas belum tersedia"
                  : `${filtered.length} dari ${tasks.length} tugas`}
            </span>
            <span>Ringkasan di atas mencakup seluruh keluarga</span>
          </div>
          <div className="task-mobile-tabs" aria-label="Status tugas">
            {COLUMNS.map(({ status, label }) => (
              <button
                key={status}
                onClick={() => setMobileStatus(status)}
                aria-pressed={mobileStatus === status}
              >
                {label}
                <span>
                  {filtered.filter((t) => t.status === status).length}
                </span>
              </button>
            ))}
          </div>
          {tasksQuery.isError ? (
            <QueryError retry={() => void tasksQuery.refetch()} />
          ) : (
            <div className="task-board">
              {COLUMNS.map(({ status, label, className }) => {
                const items = filtered.filter((t) => t.status === status);
                return (
                  <section
                    key={status}
                    className={cn(
                      "task-column",
                      className,
                      mobileStatus !== status && "mobile-hidden",
                    )}
                    aria-label={label}
                  >
                    <div className="task-column-header">
                      <h2>
                        <span className="task-status-dot" />
                        {label}
                        <span className="task-column-count">
                          {items.length}
                        </span>
                      </h2>
                      <button
                        aria-label={`Tambah tugas ${label.toLowerCase()}`}
                        disabled={!!busyId}
                        onClick={() => setDialog({ status })}
                        className="task-icon-button"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {tasksQuery.isPending ? (
                        <>
                          <Skeleton className="h-36 rounded-xl" />
                          <Skeleton className="h-28 rounded-xl" />
                        </>
                      ) : items.length ? (
                        items.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            members={members}
                            onEdit={(task) =>
                              setDialog({ task, status: task.status })
                            }
                            onComplete={(task) =>
                              void changeStatus(task, "done")
                            }
                            onStatusChange={(task, status) =>
                              void changeStatus(task, status)
                            }
                            onDelete={(task) => void deleteTask(task)}
                            isBusy={!!busyId || pending}
                            isWorking={busyId === task.id}
                          />
                        ))
                      ) : (
                        <div className="task-column-empty">
                          <CircleCheck size={19} />
                          <p>
                            {search || member || due !== "all"
                              ? "Tidak ada tugas yang cocok."
                              : status === "done"
                                ? "Hasil bantuanmu akan muncul di sini."
                                : status === "in_progress"
                                  ? "Siap mulai membantu?"
                                  : "Semua rencana sudah tertata."}
                          </p>
                          {status === "pending" && (
                            <button onClick={() => setDialog({ status })}>
                              Tambah tugas pertama
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
        <Leaderboard
          entries={leaderboard.data ?? []}
          members={members}
          isLoading={leaderboard.isPending}
          isError={leaderboard.isError}
          onRetry={() => void leaderboard.refetch()}
        />
      </div>
      <TaskModal
        isOpen={!!dialog}
        onClose={() => !pending && setDialog(null)}
        onSave={save}
        onDelete={
          dialog?.task ? () => void deleteTask(dialog.task!) : undefined
        }
        task={dialog?.task}
        initialStatus={dialog?.status}
        members={members}
        membersUnavailable={unavailable}
        isSaving={create.isPending || update.isPending}
        isDeleting={remove.isPending}
      />
    </div>
  );
}
