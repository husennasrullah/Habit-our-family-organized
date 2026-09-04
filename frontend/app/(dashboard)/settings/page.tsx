"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Users, User, Shield, LogOut } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { familyApi } from "@/lib/auth-api";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthUser } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  admin:     "Admin",
  member:    "Anggota",
  child:     "Anak",
  view_only: "Hanya Lihat",
};

const ROLE_COLOR: Record<string, string> = {
  admin:     "bg-teal-100 text-teal-700",
  member:    "bg-blue-100 text-blue-700",
  child:     "bg-orange-100 text-orange-700",
  view_only: "bg-neutral-100 text-neutral-500",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InviteCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 border border-dashed border-neutral-300 dark:border-neutral-600">
      <span className="flex-1 font-mono text-lg font-bold tracking-widest text-teal-700 dark:text-teal-400 select-all">
        {code}
      </span>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors bg-teal-600 hover:bg-teal-700 text-white"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" /> Disalin!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Salin
          </>
        )}
      </button>
    </div>
  );
}

function MemberRow({ member, isMe }: { member: AuthUser; isMe: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
      <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-neutral-100 dark:ring-neutral-700">
        <Image
          src={
            member.avatar_url ||
            (member.role === "child"
              ? "/icons/assets-habit/logo-user-anak.png"
              : "/icons/assets-habit/logo-user-ayah.png")
          }
          alt={member.name}
          width={36}
          height={36}
          className="h-9 w-9 object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
          {member.name}
          {isMe && (
            <span className="ml-1.5 text-xs font-normal text-neutral-400">(Kamu)</span>
          )}
        </p>
        <p className="text-xs text-neutral-400 truncate">{member.email}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLOR[member.role] ?? "bg-neutral-100 text-neutral-500"}`}>
        {ROLE_LABEL[member.role] ?? member.role}
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const user    = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  const { data: familyData, isLoading: familyLoading } = useQuery({
    queryKey: ["family"],
    queryFn:  () => familyApi.get().then((r) => r.data.data),
    enabled:  !!user?.family_id,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["family-members"],
    queryFn:  () => familyApi.getMembers().then((r) => r.data.data),
    enabled:  !!user?.family_id,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Pengaturan</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Profil, keluarga, dan anggota</p>
      </div>

      {/* ── Profil Saya ─────────────────────────────────────── */}
      <SectionCard title="Profil Saya">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-teal-200">
              <Image
                src={
                  user.avatar_url ||
                  (user.role === "child"
                    ? "/icons/assets-habit/logo-user-anak.png"
                    : "/icons/assets-habit/logo-user-ayah.png")
                }
                alt={user.name}
                width={64}
                height={64}
                className="h-16 w-16 object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">{user.name}</p>
              <p className="text-sm text-neutral-500">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[user.role] ?? "bg-neutral-100"}`}>
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
                <span className="flex items-center gap-1 text-xs text-neutral-400">
                  <Shield className="h-3 w-3" />
                  {user.auth_provider === "google" ? "Google" : user.auth_provider === "both" ? "Email + Google" : "Email"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Keluarga ─────────────────────────────────────────── */}
      {user?.family_id ? (
        <>
          <SectionCard title="Keluarga">
            {familyLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : familyData ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-neutral-400 font-medium mb-1">Nama Keluarga</p>
                  <p className="text-base font-bold text-neutral-800 dark:text-neutral-100">{familyData.name}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 font-medium mb-2">
                    Kode Undangan
                    <span className="ml-2 text-neutral-400 font-normal">— bagikan ke anggota keluarga lain</span>
                  </p>
                  <InviteCodeBox code={familyData.invite_code} />
                </div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title={`Anggota Keluarga${membersData ? ` (${membersData.length})` : ""}`}>
            {membersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : membersData && membersData.length > 0 ? (
              <div>
                {membersData.map((m) => (
                  <MemberRow key={m.id} member={m} isMe={m.id === user?.id} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 text-neutral-400">
                <Users className="h-8 w-8 opacity-40" />
                <p className="text-sm">Belum ada anggota</p>
              </div>
            )}
          </SectionCard>
        </>
      ) : (
        <SectionCard title="Keluarga">
          <div className="flex flex-col items-center gap-2 py-4 text-neutral-400">
            <User className="h-8 w-8 opacity-40" />
            <p className="text-sm text-center">Kamu belum bergabung dengan keluarga.</p>
          </div>
        </SectionCard>
      )}

      {/* ── Akun ─────────────────────────────────────────────── */}
      <SectionCard title="Akun">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Keluar dari Akun
        </button>
      </SectionCard>
    </div>
  );
}
