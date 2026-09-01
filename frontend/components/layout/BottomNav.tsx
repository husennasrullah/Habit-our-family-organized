"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Home",    img: "/icons/assets-habit/menu-dashboard.png" },
  { href: "/calendar",  label: "Kalender",img: "/icons/assets-habit/menu-calendar.png" },
  { href: "/tasks",     label: "Tugas",   img: "/icons/assets-habit/menu-tugas.png" },
  { href: "/budget",    label: "Dompet",  img: "/icons/assets-habit/menu-keuangan.png" },
  { href: "/meals",     label: "Menu",    img: "/icons/assets-habit/menu-jadwalmakan.png" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-2 pb-safe lg:hidden">
      <ul className="flex items-center justify-around">
        {BOTTOM_NAV_ITEMS.map(({ href, label, img }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                  isActive ? "text-primary-600" : "text-neutral-400"
                )}
              >
                <Image
                  src={img}
                  alt={label}
                  width={22}
                  height={22}
                  className={cn("object-contain", !isActive && "opacity-40")}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
