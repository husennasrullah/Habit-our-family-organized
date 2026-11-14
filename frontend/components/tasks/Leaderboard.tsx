"use client";
import { MemberAvatar as ProfileAvatar } from "@/components/shared/MemberAvatar";
import { Trophy, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeaderboardEntry } from "@/hooks/useTasks";
import type { FamilyMember } from "@/types";
interface LeaderboardProps {
  entries: LeaderboardEntry[];
  members: FamilyMember[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}
function MemberAvatar({ member }: { member?: FamilyMember }) {
  return (
    <span className="task-ranking-avatar">
      {member ? <ProfileAvatar member={member} size={30} /> : "?"}
    </span>
  );
}
export function Leaderboard({
  entries,
  members,
  isLoading,
  isError,
  onRetry,
}: LeaderboardProps) {
  const maxPoints = Math.max(1, ...entries.map((e) => e.total_points));
  return (
    <aside className="task-leaderboard" aria-label="Poin keluarga minggu ini">
      <div className="task-leaderboard-header">
        <span className="task-trophy">
          <Trophy size={18} />
        </span>
        <div>
          <h2 className="text-sm font-bold">Apresiasi keluarga</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Poin minggu ini · Senin–Minggu
          </p>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground" role="alert">
            Poin belum bisa dimuat.
          </p>
          <button
            onClick={onRetry}
            className="mt-2 rounded-lg border border-border px-3 py-2 text-xs"
          >
            Coba lagi
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="task-ranking-empty">
          <Star size={22} className="mx-auto text-amber-500" />
          <p className="mt-3 text-sm font-medium">Setiap bantuan berarti</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Selesaikan tugas bersama untuk mengumpulkan poin minggu ini.
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-border/60">
          {entries.map((entry, index) => {
            const member = members.find((m) => m.id === entry.member_id);
            const pct = Math.max(
              0,
              Math.min(100, Math.round((entry.total_points / maxPoints) * 100)),
            );
            return (
              <li
                key={entry.member_id}
                className="flex items-center gap-2.5 px-4 py-3"
              >
                <span className="w-3 shrink-0 text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <MemberAvatar member={member} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">
                    {member?.name ?? "Anggota keluarga"}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold tabular-nums">
                    {entry.total_points}{" "}
                    <span className="font-normal text-muted-foreground">
                      poin
                    </span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {entry.tasks_done} tugas
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="border-t border-border/60 px-4 py-3 text-[10px] leading-relaxed text-muted-foreground">
        Untuk semua anggota keluarga, terlepas dari filter papan tugas.
      </p>
    </aside>
  );
}
