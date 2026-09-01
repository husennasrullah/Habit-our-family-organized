"use client";

import { useEffect, useRef, useCallback } from "react";
import type { WsMessage } from "@/types";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws";

interface UseWebSocketOptions {
  onMessage: (msg: WsMessage) => void;
  enabled?: boolean;
}

/**
 * Connects to the backend WebSocket hub and calls `onMessage` for each
 * incoming message. Reconnects automatically on close/error with a small
 * back-off delay.
 */
export function useWebSocket({ onMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    const url = token ? `${WS_URL}?token=${token}` : WS_URL;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg: WsMessage = JSON.parse(e.data as string);
        onMessageRef.current(msg);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      retryRef.current = setTimeout(connect, 3_000);
    };
    ws.onerror = () => {
      ws.close();
    };
  }, [enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
