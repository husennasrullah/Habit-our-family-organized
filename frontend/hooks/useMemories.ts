"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, Memory } from "@/types";

export const memoryKeys = {
  all:  ["memories"] as const,
  list: (year?: number, month?: number, fav?: boolean) =>
    ["memories", year, month, fav] as const,
  detail: (id: string) => ["memories", id] as const,
};

export interface CreateMemoryPayload {
  title: string;
  content?: string;
  date: string;
}

export interface UpdateMemoryPayload {
  title?: string;
  content?: string;
  date?: string;
  is_favorite?: boolean;
}

export function useMemories(year?: number, month?: number, isFavorite?: boolean) {
  return useQuery({
    queryKey: memoryKeys.list(year, month, isFavorite),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (year)       qs.set("year",        String(year));
      if (month)      qs.set("month",       String(month));
      if (isFavorite) qs.set("is_favorite", "true");
      const { data } = await api.get<ApiResponse<Memory[]>>(
        `/memories${qs.toString() ? `?${qs}` : ""}`
      );
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useMemory(id: string) {
  return useQuery({
    queryKey: memoryKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Memory>>(`/memories/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMemoryPayload) => {
      const { data } = await api.post<ApiResponse<Memory>>("/memories", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: memoryKeys.all }),
  });
}

export function useUpdateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateMemoryPayload & { id: string }) => {
      const { data } = await api.put<ApiResponse<Memory>>(`/memories/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: memoryKeys.all }),
  });
}

export function useDeleteMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/memories/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: memoryKeys.all }),
  });
}

export function useUploadPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memoryId, files }: { memoryId: string; files: File[] }) => {
      const form = new FormData();
      files.forEach((f) => form.append("photos", f));
      // Hapus Content-Type agar axios/browser set multipart boundary otomatis
      const { data } = await api.post(
        `/memories/${memoryId}/photos`,
        form,
        {
          headers: { "Content-Type": undefined },
        }
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: memoryKeys.all }),
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ memoryId, photoId }: { memoryId: string; photoId: string }) => {
      await api.delete(`/memories/${memoryId}/photos/${photoId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: memoryKeys.all }),
  });
}
