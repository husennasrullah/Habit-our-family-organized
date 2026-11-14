"use client";

import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import { authApi } from "@/lib/auth-api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [isLoggingOut, setLoggingOut] = useState(false);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authApi.login({ email, password });
      setAuth(
        data.data.member,
        data.data.access_token,
        data.data.refresh_token,
      );
      return data.data;
    },
    [setAuth],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await authApi.register({ name, email, password });
      setAuth(
        data.data.member,
        data.data.access_token,
        data.data.refresh_token,
      );
      return data.data;
    },
    [setAuth],
  );

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setLoggingOut(true);
    try {
      let subscription: PushSubscription | null = null;
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          subscription = (await reg?.pushManager?.getSubscription()) || null;
        }
      } catch {
        /* Server-side session binding still removes delivery records. */
      }
      await api.post("/auth/logout", {
        endpoint: subscription?.endpoint || "",
      });
      clearAuth();
      await qc.cancelQueries();
      qc.clear();
      if (subscription) void subscription.unsubscribe().catch(() => false);
      router.replace("/login");
    } catch {
      toast.error(
        "Belum berhasil keluar dan mencabut sesi. Periksa koneksi, lalu coba lagi.",
      );
    } finally {
      setLoggingOut(false);
    }
  }, [clearAuth, router, qc, isLoggingOut]);

  return { user, isAuthenticated, login, register, logout, isLoggingOut };
}
