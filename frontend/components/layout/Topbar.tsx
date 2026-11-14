"use client";
import { MemberAvatar } from "@/components/shared/MemberAvatar";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  CheckCheck,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { groupTasks } from "@/lib/dashboard";
import { SidebarToggle } from "./Sidebar";

export function Topbar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const tasks = useTasks();
  const [now, setNow] = useState(() => new Date());
  const menus = useRef<HTMLDivElement>(null);
  useEffect(() => {
    menus.current?.querySelectorAll("details[open]").forEach((menu) => {
      (menu as HTMLDetailsElement).open = false;
    });
  }, [pathname]);
  const grouped = groupTasks(tasks.data ?? [], now);
  const due = grouped.today.length + grouped.overdue.length;
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (
        event.type === "pointerdown" &&
        menus.current?.contains(event.target as Node)
      )
        return;
      const focusedMenu = document.activeElement?.closest("details");
      menus.current?.querySelectorAll("details[open]").forEach((menu) => {
        (menu as HTMLDetailsElement).open = false;
      });
      if (event instanceof KeyboardEvent)
        focusedMenu?.querySelector<HTMLElement>("summary")?.focus();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      clearInterval(timer);
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  return (
    <header className="app-topbar" aria-label="Kontrol akun dan tampilan">
      <SidebarToggle />
      <div ref={menus} className="ml-auto flex items-center gap-2">
        <details
          className="topbar-disclosure"
          onToggle={(event) => {
            const current = event.currentTarget;
            if (current.open)
              menus.current?.querySelectorAll("details").forEach((menu) => {
                if (menu !== current) (menu as HTMLDetailsElement).open = false;
              });
          }}
        >
          <summary
            className="topbar-icon relative"
            aria-label="Buka pengingat tugas"
          >
            <Bell size={17} strokeWidth={1.8} />
            {!tasks.isError && !tasks.isPending && due > 0 && (
              <span className="reminder-dot" />
            )}
          </summary>
          <div className="topbar-menu reminder-menu">
            <p className="mb-1 text-sm font-bold">Pengingat hari ini</p>
            {tasks.isPending ? (
              <p className="text-xs text-muted-foreground">Memuat tugas…</p>
            ) : tasks.isError ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Pengingat belum bisa dimuat.
                </p>
                <button
                  onClick={() => void tasks.refetch()}
                  className="dashboard-link mt-2"
                >
                  Coba lagi
                </button>
              </>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {due
                    ? `${grouped.today.length} tugas hari ini${grouped.overdue.length ? ` dan ${grouped.overdue.length} tugas terlambat` : ""}.`
                    : "Tidak ada tugas hari ini atau yang terlambat."}
                </p>
                <Link
                  href="/tasks"
                  className="dashboard-link mt-3 flex items-center gap-2"
                >
                  <CheckCheck size={16} />
                  Lihat semua tugas
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </details>
        <ThemeToggle />
        {user && (
          <details
            className="topbar-disclosure"
            onToggle={(event) => {
              const current = event.currentTarget;
              if (current.open)
                menus.current?.querySelectorAll("details").forEach((menu) => {
                  if (menu !== current)
                    (menu as HTMLDetailsElement).open = false;
                });
            }}
          >
            <summary
              className="topbar-account"
              aria-label={`Buka menu akun ${user.name}`}
            >
              <span className="account-avatar">
                {user.avatar_url ? (
                  <MemberAvatar member={user} size={28} />
                ) : (
                  user.name.slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="hidden max-w-28 truncate text-xs font-semibold sm:block">
                {user.name.split(" ")[0]}
              </span>
              <ChevronDown size={13} />
            </summary>
            <div className="topbar-menu account-menu">
              <p className="truncate px-2 pb-2 text-xs text-muted-foreground">
                {user.name}
              </p>
              <Link href="/settings">
                <Settings size={16} />
                Pengaturan akun
              </Link>
              <button onClick={logout}>
                <LogOut size={16} />
                Keluar
              </button>
            </div>
          </details>
        )}
      </div>
    </header>
  );
}
