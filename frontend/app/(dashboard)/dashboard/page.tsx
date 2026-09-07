"use client";

import { useState } from "react";
import { format, getDayOfYear } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import {
  ListChecks,
  CalendarDays,
  Wallet,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ShieldCheck,
  Check,
  Syringe,
  Heart,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { useTasks, useCompleteTask } from "@/hooks/useTasks";
import { useBudgetSummary } from "@/hooks/useBudget";
import { useVaccines, useKids } from "@/hooks/useKids";
import { useEvents } from "@/hooks/useEvents";
import { useMemories } from "@/hooks/useMemories";
import { familyApi } from "@/lib/auth-api";
import { useQuery } from "@tanstack/react-query";
import { getApiDateRange } from "@/lib/calendarUtils";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarEvent, AuthUser } from "@/types";

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

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
  const user = useAuthStore((s) => s.user);
  const now = new Date();

  const [calDate, setCalDate] = useState(new Date());

  const { from, to } = getApiDateRange(now, "week");
  const { data: weekEvents = [], isLoading: evLoading } = useEvents(from, to);

  const { data: pendingTasks = [], isLoading: taskLoading } = useTasks({ status: "pending" });
  const { data: inProgressTasks = [] } = useTasks({ status: "in_progress" });
  const { data: allTasks = [] } = useTasks();
  const completeTaskMutation = useCompleteTask();

  const urgentCount = pendingTasks.filter((t) => !!t.due_date).length;
  const totalTasks = pendingTasks.length + inProgressTasks.length;

  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { data: summary, isLoading: budgetLoading } = useBudgetSummary(month, year);

  const { data: memories = [], isLoading: memLoading } = useMemories();
  const recentMemories = memories.slice(0, 4);

  const { data: kids = [] } = useKids();
  const { data: vaccines = [] } = useVaccines(kids[0]?.id ?? "");
  const upcomingVaccines = vaccines.filter((v) => v.status !== "given").slice(0, 3);

  const { data: members = [] } = useQuery({
    queryKey: ["family-members"],
    queryFn: () => familyApi.getMembers().then((r) => r.data.data),
    enabled: !!user?.family_id,
  });

  const totalBudget = summary?.by_category?.reduce((s, c) => s + (c.total ?? 0), 0) ?? 0;
  const budgetUsedPct = totalBudget > 0 ? Math.min(100, Math.round((totalBudget / 3000000) * 100)) : 40;

  const upcomingEvents = weekEvents
    .filter((e) => new Date(e.start_at) >= now)
    .slice(0, 2);

  const todayTip = DAILY_TIPS[getDayOfYear(now) % DAILY_TIPS.length];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Greeting Topbar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Halo, {user?.name?.split(" ")[0] ?? "Keluarga"}! 👋
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 capitalize">
            {format(now, "EEEE, d MMMM yyyy", { locale: dateLocale })} · Semoga harimu menyenangkan.
          </p>
        </div>
      </div>

      {/* ── Hero Section (Command Center) ─────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-teal-100/80 dark:border-neutral-800 bg-gradient-to-r from-white via-[#f8fbff] to-[#e8faf7] dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 p-6 lg:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-teal-100/40 dark:bg-teal-950/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-40 -mb-16 w-56 h-56 rounded-full bg-purple-100/40 dark:bg-purple-950/20 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Family command center
            </span>
            <h2 className="text-xl lg:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              Apa yang perlu diperhatikan hari ini?
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Ada <b className="text-neutral-900 dark:text-neutral-100 font-bold">{totalTasks} tugas</b> yang perlu diselesaikan,{" "}
              <b className="text-neutral-900 dark:text-neutral-100 font-bold">{upcomingEvents.length} acara</b> mendatang, dan pengingat keluarga yang perlu kamu cek.
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center w-36 h-36 rounded-2xl bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm border border-teal-100/60 dark:border-neutral-700 shadow-inner text-5xl">
            🛋️🌿
          </div>
        </div>
      </section>

      {/* ── Summary / Stat Cards (4 Kolom) ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tugas */}
        <Link
          href="/tasks"
          className="group relative overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-teal-50 dark:bg-teal-950/40 pointer-events-none transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            <div className="h-8 w-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <ListChecks className="h-4 w-4" />
            </div>
            <span>Tugas Hari Ini</span>
          </div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            {taskLoading ? <Skeleton className="h-8 w-12" /> : totalTasks}
          </div>
          <p className="mt-1 text-xs font-semibold text-red-500">
            {urgentCount > 0 ? `${urgentCount} mendesak` : "Semua terkendali"}
          </p>
        </Link>

        {/* Acara */}
        <Link
          href="/calendar"
          className="group relative overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950/40 pointer-events-none transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 dark:text-blue-400 flex items-center justify-center font-bold">
              <CalendarDays className="h-4 w-4" />
            </div>
            <span>Acara Mendatang</span>
          </div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            {evLoading ? <Skeleton className="h-8 w-12" /> : upcomingEvents.length}
          </div>
          <p className="mt-1 text-xs text-neutral-400 font-medium">Minggu ini</p>
        </Link>

        {/* Anggaran */}
        <Link
          href="/budget"
          className="group relative overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-pink-50 dark:bg-pink-950/40 pointer-events-none transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            <div className="h-8 w-8 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-500 dark:text-pink-400 flex items-center justify-center font-bold">
              <Wallet className="h-4 w-4" />
            </div>
            <span>Sisa Anggaran</span>
          </div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            {budgetLoading ? <Skeleton className="h-8 w-16" /> : formatRp(totalBudget)}
          </div>
          <div className="mt-2 h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 rounded-full transition-all"
              style={{ width: `${budgetUsedPct}%` }}
            />
          </div>
        </Link>

        {/* Kenangan */}
        <Link
          href="/memories"
          className="group relative overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-purple-50 dark:bg-purple-950/40 pointer-events-none transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 dark:text-purple-400 flex items-center justify-center font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>Kenangan Baru</span>
          </div>
          <div className="mt-3 text-2xl lg:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            {memLoading ? <Skeleton className="h-8 w-12" /> : memories.length}
          </div>
          <p className="mt-1 text-xs text-neutral-400 font-medium">
            {recentMemories.length > 0 ? `+${recentMemories.length} foto baru` : "Belum ada foto"}
          </p>
        </Link>
      </div>

      {/* ── Content Grid (Left + Right Columns) ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri (7 Kolom) */}
        <div className="lg:col-span-7 space-y-6">
          {/* ── Tugas Utama Card ─────────────────────────────── */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-teal-500 font-black">☷</span>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Tugas Utama</h2>
              </div>
              <Link href="/tasks" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {taskLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                </div>
              ) : pendingTasks.length === 0 && inProgressTasks.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-neutral-400">
                  Semua tugas sudah selesai 🎉
                </div>
              ) : (
                [...pendingTasks, ...inProgressTasks].slice(0, 4).map((task) => {
                  const isDone = task.status === "done";
                  const isUrgent = !!task.due_date;
                  return (
                    <div key={task.id} className="flex items-center gap-3.5 px-6 py-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                      <button
                        onClick={() => completeTaskMutation.mutate(task.id)}
                        className={`h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          isDone ? "border-teal-500 bg-teal-500 text-white" : "border-neutral-300 hover:border-teal-500"
                        }`}
                      >
                        {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isDone ? "line-through text-neutral-400" : "text-neutral-900 dark:text-neutral-100"}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {task.status === "in_progress"
                            ? "Sedang dikerjakan"
                            : task.due_date
                            ? `Jatuh tempo: ${task.due_date}`
                            : "Belum dijadwalkan"}
                        </p>
                      </div>

                      <span
                        className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider uppercase ${
                          task.status === "in_progress"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                            : isUrgent
                            ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                            : "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400"
                        }`}
                      >
                        {task.status === "in_progress" ? "BERJALAN" : isUrgent ? "MENDESAK" : "RUMAH"}
                      </span>

                      <button className="text-neutral-300 hover:text-neutral-500 p-1">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Pengeluaran Bulan Ini Card ────────────────────── */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-teal-500 font-black">◉</span>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Pengeluaran Bulan Ini</h2>
              </div>
              <Link href="/budget" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
                Lihat Detail
              </Link>
            </div>

            <div className="p-6">
              {budgetLoading ? (
                <Skeleton className="h-32 rounded-xl" />
              ) : !summary?.by_category?.length ? (
                <p className="text-sm text-neutral-400 text-center py-6">Belum ada pengeluaran bulan ini</p>
              ) : (
                <div className="space-y-4">
                  {summary.by_category.slice(0, 4).map((c, i) => {
                    const colors = [
                      "bg-teal-500",
                      "bg-blue-500",
                      "bg-amber-500",
                      "bg-pink-500",
                    ];
                    const color = colors[i % colors.length];
                    const pct = totalBudget > 0 ? Math.round((c.total / totalBudget) * 100) : 0;
                    return (
                      <div key={c.category} className="grid grid-cols-[130px_1fr_90px] items-center gap-3 text-xs">
                        <span className="font-medium text-neutral-600 dark:text-neutral-300 truncate">{c.category}</span>
                        <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-right font-bold text-neutral-800 dark:text-neutral-200">
                          {formatRp(c.total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan (5 Kolom) */}
        <div className="lg:col-span-5 space-y-6">
          {/* ── Kalender Card ─────────────────────────────────── */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-teal-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Kalender</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                  className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                  className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-neutral-800 dark:text-neutral-200 capitalize">
                {format(calDate, "MMMM yyyy", { locale: dateLocale })}
              </span>
              <button
                onClick={() => setCalDate(new Date())}
                className="text-neutral-400 hover:text-teal-600 font-medium text-[11px]"
              >
                Hari ini
              </button>
            </div>

            <MiniCalendar currentDate={calDate} events={weekEvents} />
          </div>

          {/* ── Reminder Vaksin Card ─────────────────────────── */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-purple-500 font-bold">✚</span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Reminder Vaksin</h3>
              </div>
              <Link href="/kids" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
                Lihat
              </Link>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 px-5">
              {upcomingVaccines.length === 0 ? (
                <div className="py-4 text-center text-xs text-neutral-400">
                  Tidak ada jadwal vaksin dalam waktu dekat
                </div>
              ) : (
                upcomingVaccines.map((v) => (
                  <div key={v.id} className="py-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                      <Syringe className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{v.vaccine_name}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {v.status === "overdue" ? "Perlu perhatian" : "Jadwal berikutnya"}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.status === "overdue"
                          ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      }`}
                    >
                      {v.status === "overdue" ? "Terlambat" : v.scheduled_date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Family Pulse Card ────────────────────────────── */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Family Pulse</h3>
              </div>
              <Link href="/settings" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
                Lihat
              </Link>
            </div>

            <div className="p-4 space-y-3">
              {members.length === 0 ? (
                <div className="text-center text-xs text-neutral-400 py-2">Belum ada data anggota</div>
              ) : (
                members.slice(0, 3).map((m: AuthUser) => {
                  const mTasks = allTasks.filter((t) => t.assigned_to === m.id);
                  const mDone = mTasks.filter((t) => t.status === "done").length;
                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-neutral-100 dark:ring-neutral-800">
                        <Image
                          src={
                            m.avatar_url ||
                            (m.role === "child"
                              ? "/icons/assets-habit/logo-user-anak.png"
                              : "/icons/assets-habit/logo-user-ayah.png")
                          }
                          alt={m.name}
                          width={36}
                          height={36}
                          className="h-9 w-9 object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{m.name}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {mTasks.length > 0 ? `${mDone}/${mTasks.length} tugas selesai` : "Belum ada tugas"}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                        {mTasks.length > 0 && mDone === mTasks.length ? "SELESAI" : "AKTIF"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tip Harian Banner ─────────────────────────────────────────── */}
      <section className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-900/40 p-5 shadow-sm">
        <div className="text-2xl flex-shrink-0">✨</div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Tips Hari Ini
          </h4>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-0.5">{todayTip}</p>
        </div>
      </section>
    </div>
  );
}

// ── Mini Calendar Component ──────────────────────────────────────────────────
function MiniCalendar({ currentDate, events }: { currentDate: Date; events: CalendarEvent[] }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventDays = new Set(events.map((e) => new Date(e.start_at).getDate()));

  const DAY_LABELS = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];
  const startOffset = firstDay;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="grid grid-cols-7 mb-1 text-center">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-[10px] font-bold text-neutral-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-7" />;
          const isToday = isCurrentMonth && day === todayDate;
          const hasEvent = eventDays.has(day);

          return (
            <div key={i} className="flex flex-col items-center justify-center h-7 relative">
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isToday
                    ? "bg-teal-500 text-white font-black shadow-sm"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {day}
              </span>
              {hasEvent && !isToday && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-teal-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
