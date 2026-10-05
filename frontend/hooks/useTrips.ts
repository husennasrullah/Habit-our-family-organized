import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ApiResponse,
  Trip,
  CreateTripPayload,
  UpdateTripPayload,
  TripItinerary,
  CreateItineraryPayload,
  TripItineraryBudget,
  CreateItineraryBudgetPayload,
  TripPackingItem,
  CreatePackingItemPayload,
  TripExpense,
  TripExpenseSplit,
  TripDocument,
  CreateTripExpensePayload,
} from "@/types";

export const tripKeys = {
  all: ["trips"] as const,
  list: () => ["trips", "list"] as const,
  detail: (id: string) => ["trips", "detail", id] as const,
};

export function useTrips() {
  return useQuery({
    queryKey: tripKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Trip[]>>("/trips");
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Trip>>(`/trips/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTripPayload) => {
      const { data } = await api.post<ApiResponse<Trip>>("/trips", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateTripPayload }) => {
      const { data } = await api.put<ApiResponse<Trip>>(`/trips/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: tripKeys.all });
      qc.invalidateQueries({ queryKey: tripKeys.detail(vars.id) });
    },
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/trips/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

// ─── Itineraries ─────────────────────────────────────────────────────────────

export function useAddItinerary(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateItineraryPayload) => {
      const { data } = await api.post<ApiResponse<TripItinerary>>(`/trips/${tripId}/itineraries`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}

export function useUpdateItinerary(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itineraryId, payload }: { itineraryId: string; payload: Partial<CreateItineraryPayload> }) => {
      const { data } = await api.put<ApiResponse<TripItinerary>>(
        `/trips/${tripId}/itineraries/${itineraryId}`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}

export function useDeleteItinerary(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itineraryId: string) => {
      await api.delete(`/trips/${tripId}/itineraries/${itineraryId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}

// ─── Itinerary Budget Items ───────────────────────────────────────────────────

export function useAddItineraryBudget(tripId: string, itineraryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateItineraryBudgetPayload) => {
      const { data } = await api.post<ApiResponse<TripItineraryBudget>>(
        `/trips/${tripId}/itineraries/${itineraryId}/budgets`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
    },
  });
}

export function useDeleteItineraryBudget(tripId: string, itineraryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (budgetId: string) => {
      await api.delete(`/trips/${tripId}/itineraries/${itineraryId}/budgets/${budgetId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
    },
  });
}

// ─── Packing Items ───────────────────────────────────────────────────────────

export function useAddPackingItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePackingItemPayload) => {
      const { data } = await api.post<ApiResponse<TripPackingItem>>(`/trips/${tripId}/packing`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}

export function useTogglePackingItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data } = await api.patch<ApiResponse<TripPackingItem>>(`/trips/${tripId}/packing/${itemId}/toggle`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}

export function useDeletePackingItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/trips/${tripId}/packing/${itemId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}

// ─── Expenses & Split Bill ───────────────────────────────────────────────────

export function useAddTripExpense(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTripExpensePayload) => {
      const { data } = await api.post<ApiResponse<TripExpense>>(`/trips/${tripId}/expenses`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}

export function useDeleteTripExpense(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expenseId: string) => {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}

export function useToggleExpenseSplit(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ expenseId, splitId }: { expenseId: string; splitId: string }) => {
      const { data } = await api.patch<ApiResponse<TripExpenseSplit>>(
        `/trips/${tripId}/expenses/${expenseId}/splits/${splitId}/toggle`
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
    },
  });
}

// ─── Documents & Tickets ─────────────────────────────────────────────────────

export function useUploadTripDocument(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post<ApiResponse<TripDocument>>(`/trips/${tripId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}

export function useDeleteTripDocument(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (docId: string) => {
      await api.delete(`/trips/${tripId}/documents/${docId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      qc.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}
