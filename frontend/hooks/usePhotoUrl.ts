"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
/** Authenticated, cancellable photo reads; object URLs live only as long as the view. */
export function usePhotoResource(rawUrl: string) {
  const identity = useAuthStore(
    (s) => `${s.user?.id ?? ""}:${s.user?.family_id ?? ""}:${s.authVersion}`,
  );
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: "", url: "", error: false });
  const key = `${identity}:${rawUrl}:${attempt}`;
  useEffect(() => {
    if (!rawUrl) return;
    const controller = new AbortController();
    let objectUrl = "";
    let active = true;
    setState({ key, url: "", error: false });
    if (
      !rawUrl.startsWith("/api/v1/memories/") &&
      !rawUrl.startsWith("/memories/")
    ) {
      setState({ key, url: "", error: true });
      return;
    }
    const path = rawUrl.startsWith("/api/v1/") ? rawUrl.slice(7) : rawUrl;
    api
      .get<Blob>(path, { responseType: "blob", signal: controller.signal })
      .then(({ data }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(data);
        setState({ key, url: objectUrl, error: false });
      })
      .catch(() => {
        if (active) setState({ key, url: "", error: true });
      });
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [rawUrl, key]);
  return {
    url: state.key === key ? state.url : "",
    error: state.key === key && state.error,
    retry: () => setAttempt((n) => n + 1),
  };
}
export function usePhotoUrl(rawUrl: string): string {
  return usePhotoResource(rawUrl).url;
}
