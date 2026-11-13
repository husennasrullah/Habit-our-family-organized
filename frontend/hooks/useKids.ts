"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { canManageKids, type KidResource } from "@/lib/kids";
import type {
  ApiResponse,
  KidProfile,
  GrowthRecord,
  VaccineRecord,
  Milestone,
  HealthRecord,
} from "@/types";

export const kidsKeys = {
  list: ["kids"] as const,
  growth: (id: string) => ["kids", id, "growth"] as const,
  vaccines: (id: string) => ["kids", id, "vaccines"] as const,
  milestones: (id: string) => ["kids", id, "milestones"] as const,
  health: (id: string) => ["kids", id, "health"] as const,
};
export function useKids() {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: kidsKeys.list,
    enabled: canManageKids(role),
    queryFn: async () =>
      (await api.get<ApiResponse<KidProfile[]>>("/kids")).data.data ?? [],
  });
}
function useKidRecords<T>(kidId: string, resource: KidResource) {
  const role = useAuthStore((s) => s.user?.role);
  return useQuery({
    queryKey: kidsKeys[resource](kidId),
    enabled: !!kidId && canManageKids(role),
    queryFn: async () =>
      (await api.get<ApiResponse<T[]>>(`/kids/${kidId}/${resource}`)).data
        .data ?? [],
  });
}
export const useGrowth = (kidId: string) =>
  useKidRecords<GrowthRecord>(kidId, "growth");
export const useVaccines = (kidId: string) =>
  useKidRecords<VaccineRecord>(kidId, "vaccines");
export const useMilestones = (kidId: string) =>
  useKidRecords<Milestone>(kidId, "milestones");
export const useHealthRecords = (kidId: string) =>
  useKidRecords<HealthRecord>(kidId, "health");

type ProfilePayload = {
  name: string;
  gender: string;
  birth_date: string;
  notes: string;
};
export function useSaveKid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id?: string;
      payload: ProfilePayload;
    }) => {
      const { data } = id
        ? await api.put<ApiResponse<KidProfile>>(`/kids/${id}`, payload)
        : await api.post<ApiResponse<KidProfile>>("/kids", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: kidsKeys.list }),
  });
}
export function useDeleteKid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/kids/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: kidsKeys.list }),
  });
}
type RecordPayload = Record<string, string | number | boolean | null>;
export function useSaveKidRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kidId,
      resource,
      id,
      payload,
    }: {
      kidId: string;
      resource: KidResource;
      id?: string;
      payload: RecordPayload;
    }) => {
      const url = `/kids/${kidId}/${resource}${id ? `/${id}` : ""}`;
      return id
        ? (await api.put(url, payload)).data.data
        : (await api.post(url, payload)).data.data;
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: kidsKeys[vars.resource](vars.kidId) }),
  });
}
export function useDeleteKidRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kidId,
      resource,
      id,
    }: {
      kidId: string;
      resource: KidResource;
      id: string;
    }) => {
      await api.delete(`/kids/${kidId}/${resource}/${id}`);
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: kidsKeys[vars.resource](vars.kidId) }),
  });
}
export function useSetMilestoneAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kidId,
      id,
      achieved,
      achieved_at,
    }: {
      kidId: string;
      id: string;
      achieved: boolean;
      achieved_at?: string;
    }) =>
      (
        await api.patch(`/kids/${kidId}/milestones/${id}/achievement`, {
          achieved,
          achieved_at,
        })
      ).data.data,
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: kidsKeys.milestones(vars.kidId) }),
  });
}
