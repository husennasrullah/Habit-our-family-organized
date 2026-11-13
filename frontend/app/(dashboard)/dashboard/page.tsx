"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  ArrowUpRight,
  ArrowRight,
  CheckSquare2,
  LayoutGrid,
  Sprout,
  CalendarDays,
  Check,
  Clock3,
  Images,
  ListChecks,
  Loader2,
  Plus,
  Syringe,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useTasks, useCompleteTask } from "@/hooks/useTasks";
import { useEvents } from "@/hooks/useEvents";
import { useBudgets, useBudgetSummary } from "@/hooks/useBudget";
import { useMealPlans } from "@/hooks/useMealPlans";
import { cn } from "@/lib/utils";
import { useMemories } from "@/hooks/useMemories";
import { useKids, useVaccines } from "@/hooks/useKids";
import { EmptyIllustration } from "@/components/shared/EmptyIllustration";
import { ContentState } from "@/components/shared/ContentState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  budgetOverview,
  dateKey,
  dayRange,
  eventsForDay,
  groupTasks,
  localDateKey,
} from "@/lib/dashboard";
import type { KidProfile } from "@/types";

const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
const dateLabel = (value: string) =>
  format(new Date(`${dateKey(value)}T12:00:00`), "d MMM", { locale: id });
const actionClass = "dashboard-btn";

function Section({
  title,
  href,
  children,
  icon,
  variant,
}: {
  title: string;
  href: string;
  children: ReactNode;
  icon: ReactNode;
  variant?: "agenda" | "tasks";
}) {
  return (
    <section
      className={cn(
        "dashboard-panel",
        variant && "dashboard-focus-card",
        variant === "agenda" && "dashboard-focus-agenda",
        variant === "tasks" && "dashboard-focus-tasks",
      )}
    >
      <div className="dashboard-panel-heading">
        <h2 className="flex min-w-0 items-center gap-2.5 text-sm font-bold">
          {icon}
          {title}
        </h2>
        <Link
          href={href}
          aria-label={`Lihat semua ${title.toLowerCase()}`}
          className="dashboard-link"
        >
          Lihat semua
          <ArrowRight size={14} />
        </Link>
      </div>
      {children}
    </section>
  );
}

function LoadingBlock() {
  return (
    <div role="status" aria-label="Memuat data" className="space-y-3">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}
function ErrorBlock({ retry }: { retry: () => void }) {
  return (
    <ContentState
      error
      title="Data belum bisa dimuat"
      description="Coba muat kembali untuk melihat informasi terbaru."
      action={
        <button
          onClick={retry}
          className={`${actionClass} border border-border`}
        >
          Coba lagi
        </button>
      }
    />
  );
}

function KidReminders({ kid, today }: { kid: KidProfile; today: string }) {
  const vaccines = useVaccines(kid.id);
  if (vaccines.isPending)
    return <Skeleton className="h-14 w-full rounded-xl" />;
  if (vaccines.isError)
    return <ErrorBlock retry={() => void vaccines.refetch()} />;
  const upcoming = (vaccines.data ?? [])
    .filter((v) => v.status !== "given" && dateKey(v.scheduled_date))
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
    .slice(0, 2);
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{kid.name}</p>
      {upcoming.length ? (
        upcoming.map((vaccine) => (
          <div
            key={vaccine.id}
            className="flex items-center justify-between gap-3 border-t border-border py-3"
          >
            <span className="min-w-0 break-words text-sm text-muted-foreground">
              {vaccine.vaccine_name}
            </span>
            <span
              className={`shrink-0 rounded-lg px-2 py-1 text-xs ${dateKey(vaccine.scheduled_date)! < today ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200" : "bg-muted text-foreground"}`}
            >
              {dateKey(vaccine.scheduled_date)! < today ? "Terlambat · " : ""}
              {dateLabel(vaccine.scheduled_date)}
            </span>
          </div>
        ))
      ) : (
        <p className="text-xs text-muted-foreground">
          Tidak ada jadwal vaksin tertunda.
        </p>
      )}
    </div>
  );
}

function FocusEmpty({
  kind,
  title,
  description,
  action,
}: {
  kind: "calendar" | "task";
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="dashboard-empty" role="status">
      <Image
        src={`/illustrations/${kind === "calendar" ? "calendar" : "task"}-empty-v3.webp`}
        alt=""
        width={180}
        height={120}
        className="dashboard-empty-art"
      />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const range = dayRange(now);
  const tasks = useTasks();
  const events = useEvents(range.from, range.to);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const summary = useBudgetSummary(month, year);
  const budgets = useBudgets(month, year);
  const memories = useMemories();
  const kids = useKids();
  const meals = useMealPlans(localDateKey(now), localDateKey(now));
  const complete = useCompleteTask();
  const grouped = groupTasks(tasks.data ?? [], now);
  const agenda = eventsForDay(events.data ?? [], now);
  const priorityTasks = [...grouped.overdue, ...grouped.today];
  const pendingCount = (tasks.data ?? []).filter(
    (task) => task.status !== "done",
  ).length;
  const finance = budgetOverview(
    budgets.data ?? [],
    summary.data?.total ?? 0,
    month,
    year,
  );
  const financeError = summary.isError || budgets.isError;
  const financeLoading = summary.isPending || budgets.isPending;
  const snapshot = [
    {
      title: "Tugas",
      href: "/tasks",
      icon: CheckSquare2,
      color: "snapshot-mint",
      value: tasks.isPending
        ? "Memuat…"
        : tasks.isError
          ? "Tidak tersedia"
          : `${pendingCount} tertunda`,
      note: "Kebutuhan keluarga",
    },
    {
      title: "Agenda",
      href: "/calendar",
      icon: CalendarDays,
      color: "snapshot-violet",
      value: events.isPending
        ? "Memuat…"
        : events.isError
          ? "Tidak tersedia"
          : `${agenda.length} hari ini`,
      note: "Waktu bersama",
    },
    {
      title: "Pengeluaran",
      href: "/budget",
      icon: Wallet,
      color: "snapshot-peach",
      value: summary.isPending
        ? "Memuat…"
        : summary.isError
          ? "Tidak tersedia"
          : rupiah(summary.data?.total ?? 0),
      note: "Bulan ini · IDR",
    },
    {
      title: "Jadwal makan",
      href: "/meals",
      icon: UtensilsCrossed,
      color: "snapshot-pink",
      value: meals.isPending
        ? "Memuat…"
        : meals.isError
          ? "Tidak tersedia"
          : meals.data?.length
            ? `${meals.data.length} menu hari ini`
            : "Belum diatur",
      note: "Menu keluarga hari ini",
    },
  ];

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero" aria-labelledby="dashboard-greeting">
        <div className="dashboard-hero-copy">
          <p className="dashboard-date">
            <CalendarDays size={15} />
            {format(now, "EEEE, d MMMM yyyy", { locale: id })}
          </p>
          <h1 id="dashboard-greeting">
            Halo, <span>{user?.name?.split(" ")[0] ?? "Keluarga"}.</span>
          </h1>
          <p className="dashboard-hero-description">
            Hari yang baik dimulai dari hal kecil.
            <br />
            Mari atur hari ini, bersama.
          </p>
          <Link
            href="/calendar"
            className="dashboard-btn dashboard-btn-primary"
          >
            Lihat kalender
            <ArrowRight size={15} />
          </Link>
        </div>
        <Image
          src="/illustrations/family-banner-v3.webp"
          alt=""
          width={1600}
          height={534}
          priority
          className="dashboard-hero-art"
        />
      </section>

      <div className="dashboard-quick-actions">
        <span>Ruang untuk hari ini</span>
        <Link href="/tasks" className="dashboard-quick dashboard-quick-mint">
          <CheckSquare2 size={16} />
          Kelola tugas
        </Link>
        <Link href="/budget" className="dashboard-quick dashboard-quick-peach">
          <Wallet size={16} />
          Catat pengeluaran
        </Link>
        <Link href="/meals" className="dashboard-quick dashboard-quick-violet">
          <UtensilsCrossed size={16} />
          Jadwal makan
        </Link>
      </div>

      <div className="dashboard-today-grid">
        <Section
          title="Agenda hari ini"
          href="/calendar"
          icon={<CalendarDays size={20} />}
          variant="agenda"
        >
          {events.isPending ? (
            <LoadingBlock />
          ) : events.isError ? (
            <ErrorBlock retry={() => void events.refetch()} />
          ) : agenda.length === 0 ? (
            <FocusEmpty
              kind="calendar"
              title="Ada ruang untuk bersama"
              description="Belum ada agenda hari ini. Rencanakan waktu untuk keluarga."
              action={
                <Link
                  href="/calendar"
                  className="dashboard-btn dashboard-btn-soft"
                >
                  <Plus size={16} />
                  Atur agenda
                </Link>
              }
            />
          ) : (
            <div className="dashboard-data-list">
              <p className="dashboard-count">{agenda.length} agenda hari ini</p>
              <ol>
                {agenda.slice(0, 4).map((event) => (
                  <li key={event.id} className="dashboard-event">
                    <span className="event-time">
                      {event.is_all_day
                        ? "Seharian"
                        : new Date(event.start_at) < range.start
                          ? "Lintas hari"
                          : format(new Date(event.start_at), "HH:mm")}
                    </span>
                    <div className="min-w-0">
                      <Link href="/calendar" className="dashboard-item-title">
                        {event.title}
                      </Link>
                      <p className="dashboard-item-note">
                        {event.is_all_day
                          ? "Waktu bersama keluarga"
                          : `${format(new Date(event.start_at), "d MMM, HH:mm", { locale: id })} – ${format(new Date(event.end_at), "d MMM, HH:mm", { locale: id })}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              {agenda.length > 4 && (
                <Link href="/calendar" className="dashboard-link">
                  +{agenda.length - 4} agenda lainnya
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>
          )}
        </Section>
        <Section
          title="Yang perlu diselesaikan"
          href="/tasks"
          icon={<ListChecks size={20} />}
          variant="tasks"
        >
          {tasks.isPending ? (
            <LoadingBlock />
          ) : tasks.isError ? (
            <ErrorBlock retry={() => void tasks.refetch()} />
          ) : (
            <>
              <div className="dashboard-task-badges">
                <span className="dashboard-count">
                  {grouped.today.length} hari ini
                </span>
                {grouped.overdue.length > 0 && (
                  <span className="dashboard-count is-overdue">
                    {grouped.overdue.length} terlambat
                  </span>
                )}
              </div>
              {priorityTasks.length === 0 ? (
                <FocusEmpty
                  kind="task"
                  title="Tugas hari ini sudah beres"
                  description="Tidak ada tugas tertunda untuk hari ini. Nikmati waktumu bersama keluarga."
                  action={
                    <Link
                      href="/tasks"
                      className="dashboard-btn dashboard-btn-soft"
                    >
                      Lihat tugas lainnya
                    </Link>
                  }
                />
              ) : (
                <ul className="dashboard-task-list">
                  {priorityTasks.slice(0, 4).map((task) => {
                    const overdue = dateKey(task.due_date)! < localDateKey(now);
                    return (
                      <li key={task.id}>
                        <button
                          disabled={complete.isPending}
                          aria-label={`Selesaikan ${task.title}`}
                          onClick={() =>
                            complete.mutate(task.id, {
                              onSuccess: () =>
                                toast.success("Tugas selesai. Kerja bagus!"),
                              onError: () =>
                                toast.error(
                                  "Tugas belum berhasil diselesaikan. Coba lagi.",
                                ),
                            })
                          }
                          className="dashboard-task-check"
                        >
                          {complete.isPending &&
                          complete.variables === task.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                        <div className="min-w-0">
                          <Link href="/tasks" className="dashboard-item-title">
                            {task.title}
                          </Link>
                          <p
                            className={`dashboard-item-note ${overdue ? "text-red-700 dark:text-red-300" : ""}`}
                          >
                            {overdue
                              ? `Terlambat · ${dateLabel(task.due_date!)}`
                              : "Hari ini"}
                            {task.status === "in_progress"
                              ? " · Sedang dikerjakan"
                              : ""}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {grouped.unscheduled.length > 0 && (
                <Link href="/tasks" className="dashboard-unscheduled">
                  <Clock3 size={13} />
                  {grouped.unscheduled.length} tugas belum dijadwalkan
                  <ArrowRight size={13} />
                </Link>
              )}
            </>
          )}
        </Section>
      </div>

      <section
        className="dashboard-family-summary"
        aria-labelledby="family-snapshot-title"
      >
        <h2 id="family-snapshot-title">
          <LayoutGrid size={17} />
          Sekilas keluarga
        </h2>
        <div className="dashboard-snapshot-grid">
          {snapshot.map(({ title, href, icon: Icon, color, value, note }) => (
            <Link key={href} href={href} className={`snapshot-tile ${color}`}>
              <span className="snapshot-icon">
                <Icon size={21} strokeWidth={1.7} />
              </span>
              <span className="min-w-0">
                <span className="snapshot-label">{title}</span>
                <strong>{value}</strong>
                <span className="snapshot-note">{note}</span>
              </span>
              <ArrowUpRight size={13} className="snapshot-arrow" />
            </Link>
          ))}
        </div>
        <Sprout
          size={72}
          strokeWidth={1.2}
          className="summary-sprout"
          aria-hidden="true"
        />
      </section>

      <Section
        title={`Keuangan · ${format(now, "MMMM yyyy", { locale: id })}`}
        href="/budget"
        icon={
          <Wallet
            size={19}
            className="text-primary-600 dark:text-primary-200"
          />
        }
      >
        {financeLoading ? (
          <LoadingBlock />
        ) : financeError ? (
          <ErrorBlock
            retry={() => {
              void summary.refetch();
              void budgets.refetch();
            }}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-10">
            <div>
              <p className="text-sm text-muted-foreground">
                Pengeluaran bulan ini
              </p>
              <p className="mt-2 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                {rupiah(finance.spent)}
              </p>
              {finance.hasBudget ? (
                <>
                  <div className="mb-2 mt-5 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    <span>Dari anggaran {rupiah(finance.total)}</span>
                    <span>{finance.percentage}% terpakai</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Anggaran terpakai"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={finance.barPercentage}
                    aria-valuetext={`${finance.percentage}% terpakai`}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className={`h-full rounded-full ${finance.remaining! < 0 ? "bg-red-600" : "bg-primary-600"}`}
                      style={{ width: `${finance.barPercentage}%` }}
                    />
                  </div>
                  <p
                    className={`mt-3 text-sm ${finance.remaining! < 0 ? "text-red-700 dark:text-red-200" : "text-muted-foreground"}`}
                  >
                    {finance.remaining! < 0
                      ? "Melebihi anggaran"
                      : "Sisa anggaran"}{" "}
                    <span className="font-medium">
                      {rupiah(Math.abs(finance.remaining!))}
                    </span>
                  </p>
                </>
              ) : (
                <div className="mt-4 rounded-xl bg-muted p-4">
                  <p className="text-sm font-medium">Anggaran belum diatur</p>
                  <Link
                    href="/budget"
                    className="mt-1 inline-flex min-h-11 items-center gap-1 text-xs text-primary-700 dark:text-primary-200"
                  >
                    Atur anggaran keluarga
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              )}
            </div>
            <div>
              {summary.data?.by_category?.length ? (
                <>
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Pengeluaran per kategori
                  </p>
                  <div className="space-y-4">
                    {[...summary.data.by_category]
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 4)
                      .map((category) => (
                        <div key={category.category}>
                          <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                            <span className="capitalize text-muted-foreground">
                              {category.category}
                            </span>
                            <span className="font-medium">
                              {rupiah(category.total)}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary-300"
                              style={{
                                width: `${finance.spent > 0 ? Math.max(0, Math.min(100, (category.total / finance.spent) * 100)) : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <ContentState
                  title="Belum ada pengeluaran"
                  description="Catat transaksi untuk melihat ringkasan bulan ini."
                  action={
                    <Link href="/budget" className={`${actionClass} bg-muted`}>
                      Catat pengeluaran
                    </Link>
                  }
                />
              )}
            </div>
          </div>
        )}
      </Section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Section
          title="Pengingat anak"
          href="/kids"
          icon={
            <Syringe
              size={19}
              className="text-primary-600 dark:text-primary-200"
            />
          }
        >
          {kids.isPending ? (
            <LoadingBlock />
          ) : kids.isError ? (
            <ErrorBlock retry={() => void kids.refetch()} />
          ) : !kids.data?.length ? (
            <ContentState
              title="Temani setiap tumbuh kembangnya"
              description="Tambahkan profil anak untuk mencatat pertumbuhan dan jadwal vaksin."
              action={
                <Link href="/kids" className={`${actionClass} bg-muted`}>
                  Kelola profil anak
                </Link>
              }
            />
          ) : (
            <div className="space-y-5">
              {kids.data.map((kid) => (
                <KidReminders
                  key={kid.id}
                  kid={kid}
                  today={localDateKey(now)}
                />
              ))}
            </div>
          )}
        </Section>
        <Section
          title="Cerita keluarga"
          href="/memories"
          icon={
            <Images
              size={19}
              className="text-primary-600 dark:text-primary-200"
            />
          }
        >
          {memories.isPending ? (
            <LoadingBlock />
          ) : memories.isError ? (
            <ErrorBlock retry={() => void memories.refetch()} />
          ) : !memories.data?.length ? (
            <ContentState
              illustration={<EmptyIllustration name="album" />}
              title="Hal kecil, kenangan berharga"
              description="Simpan cerita pertama keluarga. Suatu hari, kalian akan senang membacanya kembali."
              action={
                <Link href="/memories" className={`${actionClass} bg-muted`}>
                  <Plus size={16} />
                  Simpan kenangan
                </Link>
              }
            />
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                {memories.data.length} kenangan tersimpan
              </p>
              <ul className="divide-y divide-border">
                {[...memories.data]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 3)
                  .map((memory) => (
                    <li key={memory.id}>
                      <Link
                        href="/memories"
                        className="flex min-h-16 items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium">
                            {memory.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {dateKey(memory.date)
                              ? dateLabel(memory.date)
                              : "Tanggal belum tersedia"}
                          </p>
                        </div>
                        <ArrowUpRight
                          size={17}
                          className="shrink-0 text-muted-foreground"
                        />
                      </Link>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </Section>
      </div>
    </div>
  );
}
