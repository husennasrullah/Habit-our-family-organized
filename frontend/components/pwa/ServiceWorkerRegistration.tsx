"use client";

import { useEffect } from "react";

/** App Router does not load next-pwa's legacy pages-router registration entry. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator) ||
      !window.isSecureContext
    )
      return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error: unknown) => {
        console.warn("HABIT service worker could not be registered", error);
      });
  }, []);
  return null;
}
