"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, KidProfile, GrowthRecord, VaccineRecord, Milestone, HealthRecord } from "@/types";

export const kidsKeys = {
  list:       ["kids"] as const,
  growth:     (id: string) => ["kids", id, "growth"] as const,
  vaccines:   (id: string) => ["kids", id, "vaccines"] as const,
  milestones: (id: string) => ["kids", id, "milestones"] as const,
  health:     (id: string) => ["kids", id, "health"] as const,
};

export function useKids() {
  return useQuery({
    queryKey: kidsKeys.list,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<KidProfile[]>>("/kids");
      return data.data ?? [];
    },
  });
}

export function useGrowth(kidId: string) {
  return useQuery({
    queryKey: kidsKeys.growth(kidId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GrowthRecord[]>>(`/kids/${kidId}/growth`);
      return data.data ?? [];
    },
    enabled: !!kidId,
  });
}

export function useVaccines(kidId: string) {
  return useQuery({
    queryKey: kidsKeys.vaccines(kidId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<VaccineRecord[]>>(`/kids/${kidId}/vaccines`);
      return data.data ?? [];
    },
    enabled: !!kidId,
  });
}

export function useMilestones(kidId: string) {
  return useQuery({
    queryKey: kidsKeys.milestones(kidId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Milestone[]>>(`/kids/${kidId}/milestones`);
      return data.data ?? [];
    },
    enabled: !!kidId,
  });
}

export function useHealthRecords(kidId: string) {
  return useQuery({
    queryKey: kidsKeys.health(kidId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HealthRecord[]>>(`/kids/${kidId}/health`);
      return data.data ?? [];
    },
    enabled: !!kidId,
  });
}

export function useCreateKid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { name: string; gender?: string; birth_date: string; notes?: string }) => {
      const { data } = await api.post<ApiResponse<KidProfile>>("/kids", p);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: kidsKeys.list }),
  });
}

export function useAddGrowth(kidId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { date: string; height_cm?: number; weight_kg?: number; head_circumference_cm?: number; notes?: string }) => {
      const { data } = await api.post<ApiResponse<GrowthRecord>>(`/kids/${kidId}/growth`, p);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: kidsKeys.growth(kidId) }),
  });
}

export function useMarkVaccineGiven(kidId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ vaccineId, given_date, given_by }: { vaccineId: string; given_date: string; given_by?: string }) => {
      const { data } = await api.patch<ApiResponse<VaccineRecord>>(
        `/kids/${kidId}/vaccines/${vaccineId}/given`,
        { given_date, given_by }
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: kidsKeys.vaccines(kidId) }),
  });
}

export function useToggleMilestone(kidId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (milestoneId: string) => {
      const { data } = await api.patch<ApiResponse<Milestone>>(
        `/kids/${kidId}/milestones/${milestoneId}/toggle`
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: kidsKeys.milestones(kidId) }),
  });
}

export function useAddHealth(kidId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { type: string; description: string; date: string; doctor?: string; medication?: string; notes?: string }) => {
      const { data } = await api.post<ApiResponse<HealthRecord>>(`/kids/${kidId}/health`, p);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: kidsKeys.health(kidId) }),
  });
}
