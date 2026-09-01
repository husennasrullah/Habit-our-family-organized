"use client";

import { format } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import { ListChecks, CalendarDays, Wallet, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useTasks } from "@/hooks/useTasks";
import { useBudgetSummary } from "@/hooks/useBudget";
import { useVaccines, useKids } from "@/hooks/useKids";
import { useEvents } from "@/hooks/useEvents";
import { useMemories } from "@/hooks/useMemories";
import { getApiDateRange } from "@/lib/calendarUtils";
import { Skeleton } from "@/components/ui/skeleton";

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Stat card kecil di atas ──────────────────────────────────────────────────
function StatCard({
  title, icon: Icon, iconColor, iconBg, main, sub,
}: {
  title: string; icon: React.ElementType;
  iconColor: string; iconBg: string;
  main: React.ReactNode; sub?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-4 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <span className="text-sm text-neutral-500 font-medium">{title}</span>
      </div>
      <div>
        <div className="text-2xl font-bold text-neutral-900">{main}</div>
        {sub && <div className="text-xs text-neutral-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Task item row ────────────────────────────────────────────────────────────
const CATEGORY_STYLE: Record<string, string> = {
  MENDESAK: "bg-red-50 text-red-600",
  SEKOLAH:  "bg-blue-50 text-blue-600",
  BELANJA:  "bg-orange-50 text-orange-600",
  RUMAH:    "bg-teal-50 text-teal-600",
  DEFAULT:  "bg-neutral-100 text-neutral-500",
};

export default function DashboardPage() {
  const user  = useAuthStore((s) => s.user);
  const now   = new Date();
  const hour  = now.getHours();
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  // Data
  const { from, to }   = getApiDateRange(now, "week");
  const { data: weekEvents = [], isLoading: evLoading } = useEvents(from, to);

  const { data: pendingTasks = [], isLoading: taskLoading } = useTasks({ status: "pending" });
  const { data: inProgressTasks = [] } = useTasks({ status: "in_progress" });
  const urgentCount = pendingTasks.filter((t) => !!t.due_date).length;
  const totalTasks  = pendingTasks.length + inProgressTasks.length;

  const month  = now.getMonth() + 1;
  const year   = now.getFullYear();
  const { data: summary, isLoading: budgetLoading } = useBudgetSummary(month, year);

  const { data: memories = [], isLoading: memLoading } = useMemories(undefined, undefined, undefined);
  const recentMemories = memories.slice(0, 4);

  const { data: kids = [] } = useKids();
  const { data: vaccines = [] } = useVaccines(kids[0]?.id ?? "");
  const upcomingVaccines = vaccines.filter((v) => v.status !== "given").slice(0, 3);

  // Hitung budget %
  const totalBudget = summary?.by_category?.reduce((s, c) => s + (c.total ?? 0), 0) ?? 0;
  const budgetUsedPct = totalBudget > 0 ? Math.min(100, Math.round((totalBudget / (totalBudget * 2)) * 100)) : 45;

  // Upcoming events minggu ini
  const upcomingEvents = weekEvents
    .filter((e) => new Date(e.start_at) >= now)
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* ── Greeting ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Halo, {user?.name?.split(" ")[0] ?? "Keluarga"}! 👋
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500 capitalize">
          {format(now, "EEEE, d MMMM yyyy", { locale: dateLocale })}. Semoga harimu menyenangkan.
        </p>
      </div>

      {/* ── 4 Stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Tugas Hari Ini"
          icon={ListChecks}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          main={taskLoading ? <Skeleton className="h-7 w-8" /> : totalTasks}
          sub={urgentCount > 0 ? <span className="text-red-500 font-medium">{urgentCount} mendesak</span> : "Tidak ada yang mendesak"}
        />
        <StatCard
          title="Acara Mendatang"
          icon={CalendarDays}
          iconBg="bg-teal-50"
          iconColor="text-teal-500"
          main={evLoading ? <Skeleton className="h-7 w-8" /> : upcomingEvents.length}
          sub="Minggu ini"
        />
        <StatCard
          title="Anggaran Sisa"
          icon={Wallet}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
          main={budgetLoading ? <Skeleton className="h-7 w-16" /> : `${budgetUsedPct}%`}
          sub={summary ? <span className="text-rose-500">{formatRp(totalBudget)}</span> : "Belum ada data"}
        />
        <StatCard
          title="Kenangan Baru"
          icon={Sparkles}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          main={memLoading ? <Skeleton className="h-7 w-8" /> : memories.length}
          sub={recentMemories.length > 0 ? `+${recentMemories.length} foto baru` : "Belum ada foto"}
        />
      </div>

      {/* ── Main content: 2 kolom ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Kiri: Tugas Utama */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-50 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary-500" />
                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Tugas Utama</h2>
              </div>
              <Link href="/tasks" className="text-xs font-medium text-primary-600 hover:underline">
                Lihat Semua
              </Link>
            </div>
            <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
              {taskLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : pendingTasks.length === 0 && inProgressTasks.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-neutral-400">
                  Semua tugas sudah selesai 🎉
                </div>
              ) : (
                [...pendingTasks, ...inProgressTasks].slice(0, 5).map((task) => {
                  const cat = task.status === "in_progress" ? "BERJALAN" : task.due_date ? "MENDESAK" : "BELANJA";
                  const style = CATEGORY_STYLE[cat] ?? CATEGORY_STYLE.DEFAULT;
                  const isDone = task.status === "done";
                  return (
                    <div key={task.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isDone ? "border-primary-500 bg-primary-500" : "border-neutral-300"}`}>
                        {isDone && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDone ? "line-through text-neutral-400" : "text-neutral-800 dark:text-neutral-100"}`}>
                          {task.title}
                        </p>
                        {task.due_date && (
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {task.status === "in_progress" ? "Sedang dikerjakan" : `Jatuh tempo ${task.due_date}`}
                          </p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${style}`}>
                        {cat}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pengeluaran Bulan Ini */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-50 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary-500" />
                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Pengeluaran Bulan Ini</h2>
              </div>
              <Link href="/budget" className="text-xs font-medium text-primary-600 hover:underline">
                Lihat Detail
              </Link>
            </div>
            <div className="p-5">
              {budgetLoading ? (
                <Skeleton className="h-20 rounded-lg" />
              ) : !summary?.by_category?.length ? (
                <p className="text-sm text-neutral-400 text-center py-4">Belum ada pengeluaran bulan ini</p>
              ) : (
                <div className="space-y-3">
                  {summary.by_category.slice(0, 4).map((c, i) => {
                    const colors = ["bg-teal-500", "bg-blue-400", "bg-amber-400", "bg-rose-400"];
                    const pct = totalBudget > 0 ? Math.round((c.total / totalBudget) * 100) : 0;
                    return (
                      <div key={c.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${colors[i % colors.length]}`} />
                            <span className="text-neutral-600">{c.category}</span>
                          </div>
                          <span className="font-medium text-neutral-700">{formatRp(c.total)}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-neutral-100">
                          <div
                            className={`h-1.5 rounded-full ${colors[i % colors.length]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-1 flex items-center justify-between text-sm border-t border-neutral-100 mt-2">
                    <span className="text-neutral-500">Total</span>
                    <span className="font-bold text-neutral-900">{formatRp(totalBudget)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kanan: Mini kalender + acara mendatang */}
        <div className="space-y-4">
          {/* Mini kalender */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Kalender</h3>
              <div className="flex gap-1">
                <button className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <MiniCalendar currentDate={now} events={weekEvents} />
          </div>

          {/* Upcoming vaccine */}
          {upcomingVaccines.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-50">
                <span className="text-sm font-semibold text-neutral-800">Reminder Vaksin</span>
              </div>
              <div className="divide-y divide-neutral-50">
                {upcomingVaccines.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-2 px-4 py-3">
                    <span className="text-sm text-neutral-700 truncate">{v.vaccine_name}</span>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      v.status === "overdue" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {v.status === "overdue" ? "Terlambat" : v.scheduled_date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Mini calendar component ──────────────────────────────────────────────────
import type { CalendarEvent } from "@/types";

function MiniCalendar({ currentDate, events }: { currentDate: Date; events: CalendarEvent[] }) {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = currentDate.getDate();

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Hari dengan event
  const eventDays = new Set(
    events.map((e) => new Date(e.start_at).getDate())
  );

  const DAY_LABELS = ["M", "S", "S", "R", "K", "J", "S"];
  // Mulai dari Senin
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[11px] text-neutral-400 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday   = day === today;
          const hasEvent  = eventDays.has(day);
          return (
            <div key={i} className="flex flex-col items-center">
              <span className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-medium
                ${isToday ? "bg-primary-600 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}>
                {day}
              </span>
              {hasEvent && !isToday && (
                <span className="h-1 w-1 rounded-full bg-primary-400 -mt-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
