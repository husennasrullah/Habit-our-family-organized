"use client";
import { useEffect, useState } from "react";
/** Read source context after hydration without forcing static pages into a suspense boundary. */
export function useCalendarContext() {
  const [context, setContext] = useState<{
    date?: string;
    record?: string;
    kid?: string;
    tab?: string;
    sources?: string;
    event?: string;
  }>({});
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const date = q.get("date") ?? "";
    setContext({
      date:
        /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date))
          ? date
          : undefined,
      record: q.get("record") ?? undefined,
      kid: q.get("kid") ?? undefined,
      tab: q.get("tab") ?? undefined,
      sources: q.get("sources") ?? undefined,
      event: q.get("event") ?? undefined,
    });
  }, []);
  useEffect(() => {
    if (!context.record) return;
    let frame = 0;
    let target: HTMLElement | null = null;
    const find = () => {
      const matches = Array.from(
        document.querySelectorAll<HTMLElement>(
          `[data-calendar-record="${CSS.escape(context.record!)}"]`,
        ),
      );
      target = matches.find((el) => el.getClientRects().length > 0) ?? null;
      if (!target) return false;
      observer.disconnect();
      target.classList.add("calendar-record-highlight");
      frame = requestAnimationFrame(() => {
        target?.scrollIntoView({
          block: "center",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      });
      return true;
    };
    const observer = new MutationObserver(find);
    if (!find())
      observer.observe(document.body, { subtree: true, childList: true });
    const timeout = setTimeout(() => observer.disconnect(), 30000);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
      target?.classList.remove("calendar-record-highlight");
    };
  }, [context.record]);
  return context;
}
