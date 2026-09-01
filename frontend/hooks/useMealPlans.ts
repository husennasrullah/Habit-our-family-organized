"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, MealPlan, CreateMealPlanPayload, UpdateMealPlanPayload } from "@/types";

export const mealPlanKeys = {
  all:  ["meal-plans"] as const,
  list: (from: string, to: string) => ["meal-plans", from, to] as const,
};

// Ambil meal plan untuk rentang tanggal (mingguan/bulanan)
export function useMealPlans(from: string, to: string) {
  return useQuery({
    queryKey: mealPlanKeys.list(from, to),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MealPlan[]>>(
        `/meal-plans?from=${from}&to=${to}`
      );
      return data.data ?? [];
    },
    enabled: !!from && !!to,
    staleTime: 30_000,
  });
}

export function useCreateMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMealPlanPayload) => {
      const { data } = await api.post<ApiResponse<MealPlan>>("/meal-plans", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mealPlanKeys.all }),
  });
}

export function useUpdateMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateMealPlanPayload & { id: string }) => {
      const { data } = await api.put<ApiResponse<MealPlan>>(`/meal-plans/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mealPlanKeys.all }),
  });
}

export function useDeleteMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/meal-plans/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mealPlanKeys.all }),
  });
}
