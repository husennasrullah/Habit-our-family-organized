"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, CalendarEvent } from "@/types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const eventKeys = {
  all: ["events"] as const,
  range: (from: string, to: string) => ["events", from, to] as const,
};

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateEventPayload {
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  is_all_day?: boolean;
  type?: "general" | "school" | "medical" | "birthday" | "vacation";
  color?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  reminder_minutes?: number;
}

export type UpdateEventPayload = Partial<CreateEventPayload>;

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useEvents(from: string, to: string) {
  return useQuery({
    queryKey: eventKeys.range(from, to),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CalendarEvent[]>>(
        `/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateEventPayload) => {
      const { data } = await api.post<ApiResponse<CalendarEvent>>(
        "/events",
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: UpdateEventPayload & { id: string }) => {
      const { data } = await api.put<ApiResponse<CalendarEvent>>(
        `/events/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
