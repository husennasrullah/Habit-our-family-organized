"use client";

import { Bell, Search } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { SidebarToggle } from "./Sidebar";

interface TopbarProps {
  title?: string;
  searchPlaceholder?: string;
}

export function Topbar({ title, searchPlaceholder }: TopbarProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-neutral-100 bg-white dark:bg-neutral-900 dark:border-neutral-800 px-4 lg:px-6">
      {/* Kiri: toggle mobile + judul halaman */}
      <div className="flex items-center gap-3 min-w-0">
        <SidebarToggle />
        {title && (
          <p className="text-sm text-neutral-500 truncate hidden sm:block">{title}</p>
        )}
      </div>

      {/* Tengah: search bar (sesuai mockup) */}
      {searchPlaceholder && (
        <div className="flex-1 max-w-xs hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
            />
          </div>
        </div>
      )}

      {/* Kanan: bell + separator + avatar */}
      <div className="flex items-center gap-2">
        <button className="relative p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors">
          <Bell className="h-5 w-5" />
          {/* dot notifikasi merah */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Separator */}
        <span className="h-5 w-px bg-neutral-200" />

        {user && (
          <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer ring-2 ring-teal-200">
            <Image
              src={user.avatar_url || (user.role === "child" ? "/icons/assets-habit/logo-user-anak.png" : "/icons/assets-habit/logo-user-ayah.png")}
              alt={user.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          </div>
        )}
      </div>
    </header>
  );
}
