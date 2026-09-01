"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/hooks/useTasks";
import type { FamilyMember } from "@/types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  members: FamilyMember[];
}

const RANK_COLORS = [
  "text-amber-500",   // 1st
  "text-neutral-400", // 2nd
  "text-amber-700",   // 3rd
];

export function Leaderboard({ entries, members }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
        <Trophy className="mx-auto mb-2 h-8 w-8 text-neutral-200" />
        <p className="text-sm text-neutral-400">Belum ada tugas selesai minggu ini</p>
      </div>
    );
  }

  const maxPoints = entries[0]?.total_points ?? 1;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-neutral-800">Leaderboard Minggu Ini</h3>
      </div>

      <ul className="divide-y divide-neutral-100">
        {entries.map((entry, idx) => {
          const member = members.find((m) => m.id === entry.member_id);
          const pct = Math.round((entry.total_points / maxPoints) * 100);

          return (
            <li key={entry.member_id} className="flex items-center gap-3 px-4 py-3">
              {/* Rank */}
              <span
                className={cn(
                  "w-5 text-center text-sm font-bold",
                  RANK_COLORS[idx] ?? "text-neutral-300"
                )}
              >
                {idx + 1}
              </span>

              {/* Avatar */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {member?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  (member?.name?.[0] ?? "?").toUpperCase()
                )}
              </div>

              {/* Name + bar */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {member?.name ?? "Anggota"}
                </p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-100">
                  <div
                    className="h-1.5 rounded-full bg-primary-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <p className="text-sm font-bold text-primary-600">{entry.total_points}</p>
                <p className="text-xs text-neutral-400">{entry.tasks_done} tugas</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
