"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { X, Menu, PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",    img: "/icons/assets-habit/menu-dashboard.png" },
  { href: "/calendar",   label: "Kalender",     img: "/icons/assets-habit/menu-calendar.png" },
  { href: "/tasks",      label: "Tugas",        img: "/icons/assets-habit/menu-tugas.png" },
  { href: "/budget",     label: "Keuangan",     img: "/icons/assets-habit/menu-keuangan.png" },
  { href: "/meals",      label: "Jadwal Makan", img: "/icons/assets-habit/menu-jadwalmakan.png" },
  { href: "/memories",   label: "Kenangan",     img: "/icons/assets-habit/menu-kenangan.png" },
  { href: "/kids",       label: "Anak",         img: "/icons/assets-habit/menu-anak.png" },
  { href: "/documents",  label: "Dokumen",      img: "/icons/assets-habit/menu-document.png" },
  { href: "/settings",   label: "Pengaturan",   img: "/icons/assets-habit/menu-pengaturan.png" },
];

export function Sidebar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const { sidebarOpen, toggleSidebar, sidebarCollapsed, toggleCollapsed } = useUIStore();
  const user       = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full flex-col bg-white dark:bg-neutral-900 transition-all duration-300",
          "border-r border-neutral-200 dark:border-neutral-800",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64",
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
          "lg:translate-x-0"
        )}
      >
        {/* ── Logo ──────────────────────────────────────────────── */}
        <div className="flex h-16 items-center justify-between px-3 border-b border-neutral-100 dark:border-neutral-800">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            <Image
              src="/icons/assets-habit/logo-habit.png"
              alt="HABIT"
              width={34}
              height={34}
              className="flex-shrink-0 object-contain"
            />
            {!sidebarCollapsed && (
              <div className="min-w-0 flex flex-col items-center">
                <span
                  className="block text-[15px] leading-none tracking-[0.15em] text-[#1a2744]"
                  style={{ fontFamily: "var(--font-nunito)", fontWeight: 900 }}
                >
                  HABIT
                </span>
                <span className="block text-[7.5px] font-semibold tracking-[0.12em] text-[#f97316] uppercase mt-0.5 whitespace-nowrap">
                  Our Family, Organized
                </span>
              </div>
            )}
          </Link>
          {/* Tombol close mobile */}
          <button
            className="p-1 text-neutral-400 hover:text-neutral-700 lg:hidden"
            onClick={toggleSidebar}
          >
            <X className="h-5 w-5" />
          </button>
          {/* Tombol collapse desktop */}
          <button
            className="hidden lg:flex p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
            onClick={toggleCollapsed}
            title={sidebarCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          >
            {sidebarCollapsed
              ? <PanelLeftOpen className="h-4 w-4" />
              : <PanelLeftClose className="h-4 w-4" />
            }
          </button>
        </div>

        {/* ── Nav items ─────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, img }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => {
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    title={sidebarCollapsed ? label : undefined}
                    className={cn(
                      "relative flex items-center rounded-xl px-2 py-2.5 text-sm font-medium transition-all",
                      sidebarCollapsed ? "justify-center" : "gap-3 px-3",
                      isActive
                        ? "bg-teal-50 text-teal-700 font-semibold"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                    )}
                  >
                    <Image
                      src={img}
                      alt={label}
                      width={20}
                      height={20}
                      className={cn(
                        "flex-shrink-0 object-contain",
                        !isActive && "opacity-60"
                      )}
                    />
                    {!sidebarCollapsed && label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── User info ─────────────────────────────── */}
        {user && (
          <div className="border-t border-neutral-100 dark:border-neutral-800 p-3">
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-teal-200">
                  <Image
                    src={user.avatar_url || (user.role === "child" ? "/icons/assets-habit/logo-user-anak.png" : "/icons/assets-habit/logo-user-ayah.png")}
                    alt={user.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                </div>
                <button
                  onClick={logout}
                  title="Keluar"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-teal-200">
                  <Image
                    src={user.avatar_url || (user.role === "child" ? "/icons/assets-habit/logo-user-anak.png" : "/icons/assets-habit/logo-user-ayah.png")}
                    alt={user.name}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-800 truncate">{user.name}</p>
                  <button
                    onClick={() => router.push("/settings")}
                    className="text-xs text-teal-600 hover:underline font-medium"
                  >
                    lihat profil
                  </button>
                </div>
                <button
                  onClick={logout}
                  title="Keluar"
                  className="flex-shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

export function SidebarToggle() {
  const { toggleSidebar } = useUIStore();
  return (
    <button
      className="p-2 text-neutral-500 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 lg:hidden"
      onClick={toggleSidebar}
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
