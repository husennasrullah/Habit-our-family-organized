"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation, isNavigationActive } from "@/lib/navigation";

const items = ["/dashboard", "/calendar", "/tasks", "/budget", "/meals"].map(
  (href) => navigation.find((item) => item.href === href)!,
);

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi cepat"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-safe shadow-[0_-3px_18px_rgba(32,45,80,0.04)] backdrop-blur-lg dark:bg-card/95 lg:hidden"
    >
      <ul className="flex px-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isNavigationActive(pathname, href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[72px] flex-col items-center justify-center gap-1 px-0.5 text-xs font-medium",
                  active
                    ? "text-primary-700 dark:text-primary-200"
                    : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-xl",
                    active && "bg-primary-600 text-white shadow-sm",
                  )}
                >
                  <Icon size={20} strokeWidth={1.7} />
                </span>
                <span className="flex h-8 max-w-full items-center justify-center text-center leading-tight">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
