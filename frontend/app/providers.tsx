"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
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

    const storedRefresh = typeof window !== "undefined"
      ? localStorage.getItem("refresh_token")
      : null;

    // Tidak perlu withCredentials — refresh_token dikirim via body
    axios
      .post(
        `${BASE_URL}/auth/refresh`,
        storedRefresh ? { refresh_token: storedRefresh } : {},
      )
      .then(({ data }) => {
        const newToken: string = data.data.access_token;
        setAccessToken(newToken);
      })
      .catch(() => {
        clearAuth();
        router.push("/login");
      });
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthSync />
        {children}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
