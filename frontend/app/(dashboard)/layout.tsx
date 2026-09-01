"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { Providers } from "@/app/providers";
import { useUIStore } from "@/stores/uiStore";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-neutral-950">
      <Sidebar />

      {/* Main area — offset ikut sidebar collapsed/expanded */}
      <div className={sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"} style={{ transition: "padding-left 300ms" }}>
        <Topbar />

        {/* pb-24 mobile = ruang untuk bottom nav + safe area */}
        <main className="p-4 pb-24 lg:p-6 lg:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
      <InstallPrompt />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <DashboardContent>{children}</DashboardContent>
    </Providers>
  );
}
