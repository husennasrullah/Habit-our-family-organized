"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, Expense, Budget, ShoppingItem, BudgetSummary } from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const budgetKeys = {
  expenses:      (m: number, y: number, cat?: string) => ["expenses", m, y, cat ?? ""] as const,
  summary:       (m: number, y: number)               => ["expenses", "summary", m, y] as const,
  budgets:       (m: number, y: number)               => ["budgets", m, y] as const,
  shoppingItems: ["shopping-items"] as const,
};

// ─── Expense hooks ────────────────────────────────────────────────────────────

export function useExpenses(month: number, year: number, category = "") {
  return useQuery({
    queryKey: budgetKeys.expenses(month, year, category),
    queryFn: async () => {
      const qs = new URLSearchParams({ month: String(month), year: String(year) });
      if (category) qs.set("category", category);
      const { data } = await api.get<ApiResponse<Expense[]>>(`/expenses?${qs}`);
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useBudgetSummary(month: number, year: number) {
  return useQuery({
    queryKey: budgetKeys.summary(month, year),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BudgetSummary>>(
        `/expenses/summary?month=${month}&year=${year}`
      );
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      amount: number; category: string; description?: string; date: string; currency?: string;
    }) => {
      const { data } = await api.post<ApiResponse<Expense>>("/expenses", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; amount?: number; category?: string; description?: string; date?: string }) => {
      const { data } = await api.put<ApiResponse<Expense>>(`/expenses/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/expenses/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

// ─── Budget hooks ─────────────────────────────────────────────────────────────

export function useBudgets(month: number, year: number) {
  return useQuery({
    queryKey: budgetKeys.budgets(month, year),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Budget[]>>(
        `/budgets?month=${month}&year=${year}`
      );
      return data.data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useUpsertBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { category: string; amount: number; month: number; year: number }) => {
      const { data } = await api.post<ApiResponse<Budget>>("/budgets", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/budgets/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

// ─── Shopping hooks ───────────────────────────────────────────────────────────

export function useShoppingItems() {
  return useQuery({
    queryKey: budgetKeys.shoppingItems,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ShoppingItem[]>>("/shopping-items");
      return data.data ?? [];
    },
    staleTime: 15_000,
  });
}

export function useCreateShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; quantity?: string; unit?: string; category?: string }) => {
      const { data } = await api.post<ApiResponse<ShoppingItem>>("/shopping-items", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.shoppingItems }),
  });
}

export function useToggleShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<ApiResponse<ShoppingItem>>(`/shopping-items/${id}/check`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.shoppingItems }),
  });
}

export function useDeleteShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/shopping-items/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.shoppingItems }),
  });
}

export function useClearCheckedItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => { await api.delete("/shopping-items/clear-checked"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.shoppingItems }),
  });
}
