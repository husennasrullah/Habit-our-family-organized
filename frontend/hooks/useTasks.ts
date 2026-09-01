"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, Task } from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const taskKeys = {
  all: ["tasks"] as const,
  list: (params: Record<string, string>) => ["tasks", params] as const,
  leaderboard: ["tasks", "leaderboard"] as const,
};

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assigned_to?: string | null;
  points?: number;
  status?: "pending" | "in_progress" | "done";
  due_date?: string | null;
  is_recurring?: boolean;
  recurrence_rule?: string;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export interface LeaderboardEntry {
  member_id: string;
  total_points: number;
  tasks_done: number;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useTasks(params: { assigned_to?: string; status?: string } = {}) {
  const query = new URLSearchParams();
  if (params.assigned_to) query.set("assigned_to", params.assigned_to);
  if (params.status)      query.set("status", params.status);
  const qs = query.toString();

  return useQuery({
    queryKey: taskKeys.list(params as Record<string, string>),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Task[]>>(
        `/tasks${qs ? `?${qs}` : ""}`
      );
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: taskKeys.leaderboard,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<LeaderboardEntry[]>>(
        "/tasks/leaderboard"
      );
      return data.data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const { data } = await api.post<ApiResponse<Task>>("/tasks", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTaskPayload & { id: string }) => {
      const { data } = await api.put<ApiResponse<Task>>(`/tasks/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}/complete`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}
