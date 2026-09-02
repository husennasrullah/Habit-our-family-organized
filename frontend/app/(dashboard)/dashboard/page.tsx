"use client";

import { format, getDayOfYear } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import { ListChecks, CalendarDays, Wallet, Sparkles, ChevronRight, MoreVertical, ShieldCheck } from "lucide-react";
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

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  title, icon: Icon, iconColor, iconBg, main, sub, href, accentColor,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  main: React.ReactNode;
  sub?: React.ReactNode;
  href: string;
  accentColor: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative"
    >
      {/* Left accent border */}
      <span className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${accentColor}`} />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <span className="text-sm text-neutral-500 font-medium">{title}</span>
        </div>
        <div className={`h-6 w-6 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <ChevronRight className={`h-3.5 w-3.5 ${iconColor}`} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{main}</div>
        {sub && <div className="text-xs text-neutral-400 mt-0.5">{sub}</div>}
      </div>
    </Link>
  );
}

// ── Badge status tugas ───────────────────────────────────────────────────────
const BADGE_STYLE: Record<string, string> = {
  MENDESAK: "bg-red-50 text-red-600 border border-red-100",
  BERJALAN: "bg-amber-50 text-amber-600 border border-amber-100",
  SEKOLAH:  "bg-blue-50 text-blue-600 border border-blue-100",
  BELANJA:  "bg-orange-50 text-orange-600 border border-orange-100",
  RUMAH:    "bg-teal-50 text-teal-600 border border-teal-100",
  DEFAULT:  "bg-neutral-100 text-neutral-500",
};

// ── Tips harian ──────────────────────────────────────────────────────────────
const DAILY_TIPS = [
  "Minum air putih yang cukup dan jangan lupa tersenyum! 😊",
  "Luangkan 10 menit untuk berbicara dengan anggota keluarga hari ini 💬",
  "Sarapan bersama keluarga bisa meningkatkan kebahagiaan rumah tangga 🍽️",
  "Apresiasi hal kecil yang dilakukan pasangan atau anak-anakmu hari ini ❤️",
  "Kurangi screen time dan nikmati momen bersama keluarga 📵",
  "Rencanakan satu aktivitas seru bersama keluarga minggu ini 🎉",
  "Jangan lupa cek jadwal vaksin dan kesehatan anak 💉",
  "Buat anggaran belanja hari ini agar keuangan lebih terkontrol 💰",
  "Ceritakan satu hal positif yang terjadi hari ini kepada keluargamu 🌟",
  "Masak bersama bisa jadi momen bonding yang menyenangkan 👨‍🍳",
];

export default function DashboardPage() {
  const user  = useAuthStore((s) => s.user);
  const now   = new Date();

  const { from, to } = getApiDateRange(now, "week");
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

  const totalBudget = summary?.by_category?.reduce((s, c) => s + (c.total ?? 0), 0) ?? 0;
  const budgetUsedPct = totalBudget > 0 ? Math.min(100, Math.round((totalBudget / (totalBudget * 2)) * 100)) : 45;

  const upcomingEvents = weekEvents
    .filter((e) => new Date(e.start_at) >= now)
    .slice(0, 2);

  // Tips hari ini berdasarkan hari dalam setahun
  const todayTip = DAILY_TIPS[getDayOfYear(now) % DAILY_TIPS.length];

  return (
    <div className="space-y-6">
      {/* ── Greeting ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
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
          accentColor="bg-amber-400"
          href="/tasks"
          main={taskLoading ? <Skeleton className="h-7 w-8" /> : totalTasks}
          sub={urgentCount > 0 ? <span className="text-red-500 font-medium">{urgentCount} mendesak</span> : "Tidak ada yang mendesak"}
        />
        <StatCard
          title="Acara Mendatang"
          icon={CalendarDays}
          iconBg="bg-teal-50"
          iconColor="text-teal-500"
          accentColor="bg-teal-400"
          href="/calendar"
          main={evLoading ? <Skeleton className="h-7 w-8" /> : upcomingEvents.length}
          sub="Minggu ini"
        />
        <StatCard
          title="Anggaran Sisa"
          icon={Wallet}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
          accentColor="bg-rose-400"
          href="/budget"
          main={budgetLoading ? <Skeleton className="h-7 w-16" /> : `${budgetUsedPct}%`}
          sub={summary ? <span className="text-rose-500">{formatRp(totalBudget)}</span> : "Belum ada data"}
        />
        <StatCard
          title="Kenangan Baru"
          icon={Sparkles}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          accentColor="bg-purple-400"
          href="/memories"
          main={memLoading ? <Skeleton className="h-7 w-8" /> : memories.length}
          sub={recentMemories.length > 0 ? `+${recentMemories.length} foto baru` : "Belum ada foto"}
        />
      </div>

      {/* ── Main content: 2 kolom ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Kiri: Tugas Utama + Pengeluaran */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Tugas Utama ─────────────────────────────────── */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-teal-500" />
                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Tugas Utama</h2>
              </div>
              <Link href="/tasks" className="text-xs font-semibold text-teal-600 hover:underline">
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
                  const badgeStyle = BADGE_STYLE[cat] ?? BADGE_STYLE.DEFAULT;
                  const isDone = task.status === "done";
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isDone ? "border-teal-500 bg-teal-500" : "border-neutral-300"}`}>
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
                      <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeStyle}`}>
                        {cat}
                      </span>
                      <button className="flex-shrink-0 p-1 rounded-md text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Pengeluaran Bulan Ini ────────────────────────── */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-500" />
                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Pengeluaran Bulan Ini</h2>
              </div>
              <Link href="/budget" className="text-xs font-semibold text-teal-600 hover:underline">
                Lihat Detail
              </Link>
            </div>
            <div className="p-5">
              {budgetLoading ? (
                <Skeleton className="h-20 rounded-lg" />
              ) : !summary?.by_category?.length ? (
                <p className="text-sm text-neutral-400 text-center py-4">Belum ada pengeluaran bulan ini</p>
              ) : (
                <div className="space-y-4">
                  {summary.by_category.slice(0, 4).map((c, i) => {
                    const colors = [
                      { bar: "bg-teal-500",  dot: "bg-teal-500"  },
                      { bar: "bg-blue-400",  dot: "bg-blue-400"  },
                      { bar: "bg-amber-400", dot: "bg-amber-400" },
                      { bar: "bg-rose-400",  dot: "bg-rose-400"  },
                    ];
                    const color = colors[i % colors.length];
                    const pct = totalBudget > 0 ? Math.round((c.total / totalBudget) * 100) : 0;
                    return (
                      <div key={c.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full flex-shrink-0 ${color.dot}`} />
                            <span className="text-neutral-600 font-medium">{c.category}</span>
                          </div>
                          <span className="font-semibold text-neutral-700">{formatRp(c.total)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-neutral-100">
                          <div
                            className={`h-2 rounded-full ${color.bar} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 flex items-center justify-between text-sm border-t border-neutral-100 mt-1">
                    <span className="text-neutral-500">Total</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatRp(totalBudget)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kanan: Mini kalender + Vaksin */}
        <div className="space-y-4">

          {/* ── Mini kalender ────────────────────────────────── */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                Kalender
              </h3>
              <div className="flex gap-0.5">
                <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            {/* Nama bulan + tahun */}
            <p className="text-xs font-medium text-neutral-500 mb-2 capitalize">
              {format(now, "MMMM yyyy", { locale: dateLocale })}
            </p>
            <MiniCalendar currentDate={now} events={weekEvents} />
          </div>

          {/* ── Reminder Vaksin ──────────────────────────────── */}
          {upcomingVaccines.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="h-6 w-6 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Reminder Vaksin</span>
              </div>
              <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                {upcomingVaccines.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-sm text-neutral-700 dark:text-neutral-200 truncate">{v.vaccine_name}</span>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      v.status === "overdue"
                        ? "bg-red-50 text-red-600 border border-red-100"
                        : "bg-blue-50 text-blue-600 border border-blue-100"
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

      {/* ── Tips Hari Ini ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 px-5 py-4">
        <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-700 mb-0.5">Tips Hari Ini</p>
          <p className="text-sm text-amber-800">{todayTip}</p>
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

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventDays = new Set(
    events.map((e) => new Date(e.start_at).getDate())
  );

  const DAY_LABELS = ["M", "S", "S", "R", "K", "J", "S"];
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[11px] text-neutral-400 font-semibold py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday  = day === today;
          const hasEvent = eventDays.has(day);
          return (
            <div key={i} className="flex flex-col items-center">
              <span className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-medium transition-colors
                ${isToday
                  ? "bg-teal-600 text-white font-bold"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                }`}
              >
                {day}
              </span>
              {hasEvent && !isToday && (
                <span className="h-1 w-1 rounded-full bg-teal-400 -mt-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
