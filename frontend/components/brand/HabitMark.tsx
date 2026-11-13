/** Hadir Bersama: the approved H / embrace symbol, kept as native vector artwork. */
export function HabitMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="40"
      height="40"
      aria-hidden="true"
      focusable="false"
      className={`habit-brand-mark shrink-0 ${className}`}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 20v30M50 20v30" />
        <path d="M14 32c9 13 27 13 36 0" />
      </g>
      <circle cx="32" cy="18" r="5.5" fill="#F5B942" />
    </svg>
  );
}
