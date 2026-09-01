import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency = "IDR",
  locale = "id-ID"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string, locale = "id-ID"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export const MEMBER_COLORS = [
  "sky",
  "rose",
  "violet",
  "amber",
  "emerald",
  "orange",
  "pink",
  "indigo",
] as const;

export type MemberColor = (typeof MEMBER_COLORS)[number];

export const MEMBER_COLOR_HEX: Record<MemberColor, string> = {
  sky: "#0ea5e9",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  emerald: "#10b981",
  orange: "#f97316",
  pink: "#ec4899",
  indigo: "#6366f1",
};
