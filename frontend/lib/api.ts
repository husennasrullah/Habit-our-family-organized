import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { refreshSession, isInvalidSession } from "@/lib/authSession";
import { useAuthStore } from "@/stores/authStore";
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (
      original &&
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.match(/\/auth\/(login|register|refresh)/)
    ) {
      original._retry = true;
      const generation = useAuthStore.getState().authVersion;
      try {
        const payload = await refreshSession();
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${payload.access_token}`,
        };
        return api(original);
      } catch (refreshError) {
        if (
          isInvalidSession(refreshError) &&
          useAuthStore.getState().authVersion === generation
        ) {
          useAuthStore.getState().clearAuth();
          if (typeof window !== "undefined") window.location.replace("/login");
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
export default api;
