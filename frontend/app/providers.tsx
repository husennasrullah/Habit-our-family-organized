"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

/**
 * AuthSync: saat Zustand hydrate dari localStorage setelah page refresh,
 * coba refresh token dulu untuk mendapatkan access token baru.
 * Jika refresh berhasil → set cookie baru.
 * Jika refresh gagal (token benar-benar expired) → clearAuth + redirect login.
 */
function AuthSync() {
  const { accessToken, isAuthenticated, setAccessToken, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    // Coba refresh untuk mendapatkan token baru (sekaligus memperpanjang cookie)
    // Kirim refresh_token di body sebagai fallback saat cross-origin (ngrok dev)
    const storedRefresh = typeof window !== "undefined"
      ? localStorage.getItem("refresh_token")
      : null;
    axios
      .post(
        `${BASE_URL}/auth/refresh`,
        storedRefresh ? { refresh_token: storedRefresh } : {},
        { withCredentials: true }
      )
      .then(({ data }) => {
        const newToken: string = data.data.access_token;
        setAccessToken(newToken);
      })
      .catch(() => {
        // Refresh gagal → token benar-benar expired → logout
        clearAuth();
        router.push("/login");
      });
    // Hanya jalankan sekali saat komponen mount (hydrate pertama kali)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
