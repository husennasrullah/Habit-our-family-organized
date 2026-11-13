import type { ReactNode } from "react";

export function ContentState({
  title,
  description,
  illustration,
  action,
  error = false,
}: {
  title: string;
  description: string;
  illustration?: ReactNode;
  action?: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-10 text-center"
    >
      {illustration && (
        <div className="mb-5 w-36" aria-hidden="true">
          {illustration}
        </div>
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
