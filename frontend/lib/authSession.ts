import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser } from "@/types";
const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
let refreshing: Promise<{
  access_token: string;
  refresh_token?: string;
  member?: AuthUser;
}> | null = null;
// One refresh across mount, expired requests and tabs' local state updates in this document.
export function refreshSession() {
  if (refreshing) return refreshing;
  const generation = useAuthStore.getState().authVersion;
  const token = localStorage.getItem("refresh_token");
  refreshing = axios
    .post(`${base}/auth/refresh`, token ? { refresh_token: token } : {}, {
      withCredentials: false,
    })
    .then(({ data }) => {
      if (useAuthStore.getState().authVersion !== generation)
        throw new Error("Sesi telah berubah");
      const payload = data.data as {
        access_token: string;
        refresh_token?: string;
        member?: AuthUser;
      };
      if (!payload?.access_token) throw new Error("Respons sesi tidak valid");
      useAuthStore.getState().setAccessToken(payload.access_token);
      if (payload.refresh_token)
        localStorage.setItem("refresh_token", payload.refresh_token);
      if (payload.member) useAuthStore.getState().setUser(payload.member);
      return payload;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}
export function isInvalidSession(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  return status === 401 || status === 403;
}
