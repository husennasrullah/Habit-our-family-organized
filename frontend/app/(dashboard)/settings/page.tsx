"use client";

import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { QueryError } from "@/components/shared/QueryError";
import { PageHeader } from "@/components/shared/PageHeader";
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
  admin: "Admin",
  member: "Anggota",
  child: "Anak",
  view_only: "Hanya Lihat",
};

const ROLE_COLOR: Record<string, string> = {
  admin: "bg-primary-100 text-primary-700",
  member: "bg-blue-100 text-blue-700",
  child: "bg-orange-100 text-orange-700",
  view_only: "bg-muted text-muted-foreground",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card dark:bg-card rounded-2xl border border-border dark:border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border dark:border-border">
        <h2 className="text-sm font-semibold text-foreground dark:text-foreground uppercase tracking-wide">
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
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
    <div className="flex items-center gap-3 bg-muted dark:bg-muted rounded-xl px-4 py-3 border border-dashed border-neutral-300 dark:border-neutral-600">
      <span className="flex-1 font-mono text-lg font-bold tracking-widest text-primary-700 dark:text-primary-200 select-all">
        {code}
      </span>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors bg-primary-600 hover:bg-primary-700 text-white"
        aria-label="Salin kode"
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

function ProfileAvatar({ user, size }: { user: AuthUser; size: number }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = user.avatar_url?.trim() || "";
  const fallback =
    user.role === "child"
      ? "/icons/assets-habit/logo-user-anak.png"
      : "/icons/assets-habit/logo-user-ayah.png";
  return (
    <Image
      src={source && source !== failedSource ? source : fallback}
      alt={user.name}
      width={size}
      height={size}
      unoptimized
      onError={() => setFailedSource(source)}
      className="h-full w-full object-cover"
    />
  );
}

function MemberRow({ member, isMe }: { member: AuthUser; isMe: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-neutral-50 dark:border-border last:border-0">
      <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-neutral-100 dark:ring-neutral-700">
        <ProfileAvatar user={member} size={36} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground dark:text-foreground truncate">
          {member.name}
          {isMe && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              (Kamu)
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
      </div>
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLOR[member.role] ?? "bg-muted text-muted-foreground"}`}
      >
        {ROLE_LABEL[member.role] ?? member.role}
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  const {
    data: familyData,
    isLoading: familyLoading,
    isError: familyError,
    refetch: retryFamily,
  } = useQuery({
    queryKey: ["family"],
    queryFn: () => familyApi.get().then((r) => r.data.data),
    enabled: !!user?.family_id,
  });

  const {
    data: membersData,
    isLoading: membersLoading,
    isError: membersError,
    refetch: retryMembers,
  } = useQuery({
    queryKey: ["family-members"],
    queryFn: () => familyApi.getMembers().then((r) => r.data.data),
    enabled: !!user?.family_id,
  });

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Header */}
      <PageHeader
        title="Pengaturan"
        description="Kelola akun, keluarga, dan kenyamanan ruangmu."
      />

      {(familyError || membersError) && (
        <QueryError
          retry={() => {
            void retryFamily();
            void retryMembers();
          }}
        />
      )}
      <SectionCard title="Tampilan">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Pilih tema terang atau gelap.
          </p>
          <ThemeToggle />
        </div>
      </SectionCard>
      {/* ── Profil Saya ─────────────────────────────────────── */}
      <SectionCard title="Profil Saya">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary-200">
              <ProfileAvatar user={user} size={64} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-foreground dark:text-foreground">
                {user.name}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[user.role] ?? "bg-muted"}`}
                >
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  {user.auth_provider === "google"
                    ? "Google"
                    : user.auth_provider === "both"
                      ? "Email + Google"
                      : "Email"}
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
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Nama Keluarga
                  </p>
                  <p className="text-base font-bold text-foreground dark:text-foreground">
                    {familyData.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    Kode Undangan
                    <span className="ml-2 text-muted-foreground font-normal">
                      — bagikan ke anggota keluarga lain
                    </span>
                  </p>
                  <InviteCodeBox code={familyData.invite_code} />
                </div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title={`Anggota Keluarga${membersData ? ` (${membersData.length})` : ""}`}
          >
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
              <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                <Users className="h-8 w-8 opacity-40" />
                <p className="text-sm">Belum ada anggota</p>
              </div>
            )}
          </SectionCard>
        </>
      ) : (
        <SectionCard title="Keluarga">
          <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
            <User className="h-8 w-8 opacity-40" />
            <p className="text-sm text-center">
              Kamu belum bergabung dengan keluarga.
            </p>
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
