import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse, FamilyMember } from "@/types";

export function useFamilyMembers() {
  return useQuery({
    queryKey: ["family-members"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FamilyMember[]>>("/family/members");
      return data.data ?? [];
    },
    staleTime: 60_000,
  });
}
