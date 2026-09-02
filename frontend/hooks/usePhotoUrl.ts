"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

function resolvePhotoUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("/")) return `${API_BASE.replace(/\/api\/v1$/, "")}${url}`;
  return url;
}

// Ambil token fresh dari localStorage setiap kali dibutuhkan
function getFreshToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") ?? "";
}

// Cache blob URL supaya tidak re-fetch setiap render
const blobCache = new Map<string, string>();

export function usePhotoUrl(rawUrl: string): string {
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

    // Ambil token fresh dari localStorage (bukan dari React state yang bisa stale)
    const token = getFreshToken();

    fetch(resolved, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        blobCache.set(rawUrl, objectUrl);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        setBlobUrl("");
      });

    return () => {};
  }, [rawUrl]);

  return blobUrl;
}
