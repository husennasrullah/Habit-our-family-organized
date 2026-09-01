"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import type { ApiResponse, AuthUser } from "@/types";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    // Simpan access token lalu ambil profil user
    localStorage.setItem("access_token", token);

    api
      .get<ApiResponse<AuthUser>>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        setAuth(data.data, token);
        if (!data.data.family_id) {
          router.replace("/onboarding");
        } else {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        router.replace("/login?error=oauth_failed");
      });
  }, [searchParams, router, setAuth]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      <p className="text-neutral-500 text-sm">Menyelesaikan login...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
