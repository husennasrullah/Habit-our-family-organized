"use client";

import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/auth-api";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authApi.login({ email, password });
      setAuth(data.data.member, data.data.access_token, data.data.refresh_token);
      return data.data;
    },
    [setAuth]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await authApi.register({ name, email, password });
      setAuth(data.data.member, data.data.access_token, data.data.refresh_token);
      return data.data;
    },
    [setAuth]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push("/login");
    }
  }, [clearAuth, router]);

  return { user, isAuthenticated, login, register, logout };
}
