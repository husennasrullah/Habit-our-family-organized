"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, FinancialGoal } from "@/types";

export const goalKeys = {
  all:  ["financial-goals"] as const,
  list: () => ["financial-goals", "list"] as const,
};

export interface CreateGoalPayload {
  title: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string | null;
  notes?: string;
}

export interface UpdateGoalPayload {
  title?: string;
  target_amount?: number;
  current_amount?: number;
  deadline?: string | null;
  notes?: string;
  is_achieved?: boolean;
}

export function useFinancialGoals() {
  return useQuery({
    queryKey: goalKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FinancialGoal[]>>("/financial-goals");
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateGoalPayload) => {
      const { data } = await api.post<ApiResponse<FinancialGoal>>("/financial-goals", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateGoalPayload & { id: string }) => {
      const { data } = await api.put<ApiResponse<FinancialGoal>>(`/financial-goals/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export function useAddFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { data } = await api.patch<ApiResponse<FinancialGoal>>(
        `/financial-goals/${id}/progress`,
        { amount }
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: goalKeys.all }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/financial-goals/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: goalKeys.all }),
  });
}
