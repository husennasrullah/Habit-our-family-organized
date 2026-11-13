"use client";

import { HabitMark } from "@/components/brand/HabitMark";
import { HabitWordmark } from "@/components/brand/HabitWordmark";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canManageKids } from "@/lib/kids";
import { navigation, isNavigationActive } from "@/lib/navigation";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleCollapsed } =
    useUIStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);
  useEffect(() => {
    if (!sidebarOpen) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const drawer = document.getElementById("mobile-navigation");
    const media = window.matchMedia("(max-width: 1023px)");
    const background = document.getElementById("dashboard-background");
    const previous = document.body.style.overflow;
    const onResize = () => {
      if (!media.matches) setSidebarOpen(false);
    };
    media.addEventListener("change", onResize);
    if (media.matches) {
      document.body.style.overflow = "hidden";
      if (background) background.inert = true;
      drawer?.setAttribute("role", "dialog");
      drawer?.setAttribute("aria-modal", "true");
      drawer?.querySelector<HTMLButtonElement>("button")?.focus();
    }
    const onKey = (event: KeyboardEvent) => {
      if (!media.matches) return;
      if (event.key === "Escape") setSidebarOpen(false);
      if (event.key === "Tab" && drawer) {
        const controls = Array.from(
          drawer.querySelectorAll<HTMLElement>("a[href], button"),
        ).filter((el) => el.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      media.removeEventListener("change", onResize);
      if (background) background.inert = false;
      drawer?.removeAttribute("role");
      drawer?.removeAttribute("aria-modal");
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      if (media.matches) opener?.focus();
    };
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/25 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        id="mobile-navigation"
        aria-label="Navigasi utama"
        className={cn(
          "app-sidebar",
          sidebarCollapsed && "is-collapsed",
          sidebarOpen ? "is-open" : "is-closed",
        )}
      >
        <div className="sidebar-brand">
          <Link
            href="/dashboard"
            aria-label="Habit — Beranda"
            className="flex min-w-0 items-center gap-2.5"
          >
            <HabitMark />
            <span
              className={cn(
                "sidebar-wordmark",
                sidebarCollapsed && "lg:hidden",
              )}
            >
              <HabitWordmark />
              <span>Ruang keluarga kita</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup navigasi"
            className="sidebar-close lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="sidebar-navigation">
          {["Sehari-hari", "Keluarga", "Akun"].map((group) => (
            <div key={group} className="sidebar-group">
              <p
                className={cn(
                  "sidebar-group-label",
                  sidebarCollapsed && "lg:sr-only",
                )}
              >
                {group}
              </p>
              <ul>
                {navigation
                  .filter(
                    (item) =>
                      item.group === group &&
                      (item.href !== "/kids" || canManageKids(user?.role)),
                  )
                  .map(({ href, label, icon: Icon }) => {
                    const active = isNavigationActive(pathname, href);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          title={label}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "sidebar-link",
                            active && "is-active",
                            sidebarCollapsed && "lg:justify-center",
                          )}
                        >
                          <Icon
                            size={18}
                            strokeWidth={1.7}
                            fill={
                              active && href === "/dashboard"
                                ? "currentColor"
                                : "none"
                            }
                          />
                          <span className={cn(sidebarCollapsed && "lg:hidden")}>
                            {label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          {user && (
            <Link
              href="/settings"
              aria-label={`Profil ${user.name}`}
              title={user.name}
              className="sidebar-profile"
            >
              <span className="sidebar-avatar">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1",
                  sidebarCollapsed && "lg:hidden",
                )}
              >
                <span className="block truncate text-xs font-bold">
                  {user.name}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  Profil keluarga
                </span>
              </span>
              <ChevronRight
                size={15}
                className={cn(
                  "shrink-0 text-muted-foreground",
                  sidebarCollapsed && "lg:hidden",
                )}
              />
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            aria-label={
              sidebarCollapsed ? "Perluas navigasi" : "Ringkas navigasi"
            }
            title={sidebarCollapsed ? "Perluas navigasi" : "Ringkas navigasi"}
            className="sidebar-collapse"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <>
                <PanelLeftClose size={16} />
                <span>Ringkas sidebar</span>
              </>
            )}
          </button>
        </div>
        <div className="sidebar-scenery" aria-hidden="true" />
      </aside>
    </>
  );
}

export function SidebarToggle() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  return (
    <button
      aria-label="Buka navigasi"
      aria-controls="mobile-navigation"
      aria-expanded={sidebarOpen}
      onClick={toggleSidebar}
      className="topbar-icon lg:hidden"
    >
      <Menu size={20} />
    </button>
  );
}
