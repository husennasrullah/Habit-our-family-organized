import api from "@/lib/api";
import type { ApiResponse, AuthTokens, AuthUser, Family } from "@/types";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<{ access_token: string; refresh_token: string; member: AuthUser }>>(
      "/auth/register",
      data
    ),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ access_token: string; refresh_token: string; member: AuthUser }>>(
      "/auth/login",
      data
    ),

  logout: () => api.post("/auth/logout"),

  refresh: () =>
    api.post<ApiResponse<AuthTokens>>("/auth/refresh"),

  getMe: () =>
    api.get<ApiResponse<AuthUser>>("/auth/me"),

  googleAuthUrl: () =>
    `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
};

// ─── Family ───────────────────────────────────────────────────────────────────

export const familyApi = {
  create: (data: { name: string }) =>
    api.post<ApiResponse<Family>>("/family", data),

  get: () =>
    api.get<ApiResponse<Family>>("/family"),

  join: (data: { invite_code: string }) =>
    api.post<ApiResponse<Family>>("/family/join", data),

  getMembers: () =>
    api.get<ApiResponse<AuthUser[]>>("/family/members"),

  updateMember: (id: string, data: Partial<AuthUser>) =>
    api.put<ApiResponse<AuthUser>>(`/family/members/${id}`, data),

  deleteMember: (id: string) =>
    api.delete(`/family/members/${id}`),
};
