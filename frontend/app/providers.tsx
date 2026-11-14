"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { refreshSession, isInvalidSession } from "@/lib/authSession";

function AuthSync() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== "keluarga-auth") return;
      try {
        const state = event.newValue ? JSON.parse(event.newValue).state : null;
        if (!state?.isAuthenticated) {
          useAuthStore.getState().clearAuth();
          void qc.cancelQueries();
          qc.clear();
          router.replace("/login");
        }
      } catch {
        /* Ignore malformed state from another tab. */
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [qc, router]);
  useEffect(() => {
    const state = useAuthStore.getState();
    if (!state.isAuthenticated) return;
    const generation = state.authVersion;
    void refreshSession().catch((error) => {
      if (
        isInvalidSession(error) &&
        useAuthStore.getState().authVersion === generation
      ) {
        useAuthStore.getState().clearAuth();
        router.replace("/login");
      }
    });
  }, [router]);
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
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      {children}
      {process.env.NODE_ENV === "development" &&
        process.env.NEXT_PUBLIC_QUERY_DEVTOOLS === "true" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
    </QueryClientProvider>
  );
}
