"use client";
import { ContentState } from "./ContentState";
export function QueryError({ retry }: { retry: () => void }) {
  return (
    <ContentState
      error
      title="Data belum bisa dimuat"
      description="Periksa koneksi, lalu coba lagi. Data yang belum dimuat tidak ditampilkan sebagai data kosong."
      action={
        <button
          onClick={retry}
          className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          Coba lagi
        </button>
      }
    />
  );
}
