import type { CSSProperties } from "react";
export type IconName =
  | "arrow"
  | "arrow-up"
  | "calendar"
  | "check"
  | "heart"
  | "task"
  | "wallet"
  | "baby"
  | "photo"
  | "sun"
  | "moon"
  | "leaf"
  | "menu"
  | "close"
  | "lock"
  | "phone"
  | "spark"
  | "chevron"
  | "plane"
  | "folder"
  | "meal"
  | "users";
const paths: Record<IconName, string[]> = {
  arrow: ["M4 12h15m-6-6 6 6-6 6"],
  "arrow-up": ["M6 18 18 6M6 6h12v12"],
  calendar: [
    "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z",
    "M7 14h2m4 0h2m-8 4h2",
  ],
  check: ["m5 12 4 4L19 6"],
  heart: [
    "M20.5 4.8a5.4 5.4 0 0 0-7.6 0L12 5.7l-.9-.9a5.4 5.4 0 0 0-7.6 7.6L12 21l8.5-8.6a5.4 5.4 0 0 0 0-7.6Z",
  ],
  task: ["m3 6 2 2 3-4M12 6h9M3 13l2 2 3-4m4 2h9M3 20l2 2 3-4m4 2h9"],
  wallet: [
    "M20 8V5H5a3 3 0 0 0 0 6",
    "M3 3v16a2 2 0 0 0 2 2h16V7H5a2 2 0 0 1-2-2",
    "M16 12h5v5h-5v-5Z",
  ],
  baby: [
    "M9 3a9 9 0 1 0 6 0M9 3c0 3 6 3 6 0",
    "M8 11h.01M16 11h.01m-5-8c-2-2 2-4 3-1m-6 14c2 2 6 2 8 0",
  ],
  photo: ["M3 3h18v18H3zM3 16l6-6 5 5 3-3 4 4", "M16 7h.01"],
  sun: [
    "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5",
    "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  ],
  moon: ["M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z"],
  leaf: ["M20 3C9 2 2 8 6 16c8 5 15-1 14-13ZM4 21 15 9"],
  menu: ["M4 6h16M4 12h16M4 18h16"],
  close: ["m6 6 12 12M6 18 18 6"],
  lock: ["M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4m-4 5v2"],
  phone: ["M6 2h12v20H6zM10 18h4"],
  spark: ["m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"],
  chevron: ["m6 9 6 6 6-6"],
  plane: ["m22 2-7 20-4-9-9-4L22 2ZM11 13 22 2"],
  folder: ["M3 5h7l2 3h9v13H3V5Z"],
  meal: ["M4 2v7a3 3 0 0 0 6 0V2M7 2v20M20 2c-5 4-5 9 0 10V2Zm0 10v10"],
  users: [
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 7m2 4a6 6 0 0 1 3 6",
  ],
};
export function Icon({
  name,
  size = 20,
  className = "",
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
