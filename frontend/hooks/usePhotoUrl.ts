"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

function resolvePhotoUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("/")) return `${API_BASE.replace(/\/api\/v1$/, "")}${url}`;
  return url;
}

// Cache blob URL supaya tidak re-fetch setiap render
const blobCache = new Map<string, string>();

export function usePhotoUrl(rawUrl: string): string {
  const token = useAuthStore((s) => s.accessToken);
  const [blobUrl, setBlobUrl] = useState<string>(() => blobCache.get(rawUrl) ?? "");

  useEffect(() => {
    if (!rawUrl) return;

    const resolved = resolvePhotoUrl(rawUrl);

    // Kalau public URL (bukan /serve proxy) — langsung pakai
    if (!rawUrl.includes("/serve")) {
      setBlobUrl(resolved);
      return;
    }

    // Kalau sudah ada di cache, pakai langsung
    if (blobCache.has(rawUrl)) {
      setBlobUrl(blobCache.get(rawUrl)!);
      return;
    }

    // Fetch dengan Authorization header lalu buat blob URL
    let objectUrl = "";
    fetch(resolved, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        blobCache.set(rawUrl, objectUrl);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        // Gagal fetch — biarkan kosong, tampilkan placeholder
        setBlobUrl("");
      });

    // Cleanup: jangan revoke karena ada di cache global
    return () => {};
  }, [rawUrl, token]);

  return blobUrl;
}
