"use client";

import { ContentState } from "@/components/shared/ContentState";
import { EmptyIllustration } from "@/components/shared/EmptyIllustration";
import { QueryError } from "@/components/shared/QueryError";
import { PageHeader } from "@/components/shared/PageHeader";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, Search, Loader2, FileIcon } from "lucide-react";
import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { ApiResponse, Document } from "@/types";

const DOC_TYPES = [
  { value: "", label: "Semua" },
  { value: "ktp", label: "KTP" },
  { value: "kk", label: "KK" },
  { value: "akta", label: "Akta" },
  { value: "asuransi", label: "Asuransi" },
  { value: "bpjs", label: "BPJS" },
  { value: "other", label: "Lainnya" },
];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const qs = new URLSearchParams();
  if (typeFilter) qs.set("type", typeFilter);
  if (search) qs.set("search", search);

  const {
    data: docs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["documents", typeFilter, search],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Document[]>>(
        `/documents?${qs}`,
      );
      return data.data ?? [];
    },
    staleTime: 30_000,
  });

  const deleteDoc = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Dokumen dihapus");
    },
    onError: () => toast.error("Gagal menghapus"),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", file.name.replace(/\.[^/.]+$/, ""));
      await api.post("/documents", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Dokumen diupload");
    } catch {
      toast.error("Gagal upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <PageHeader
        title="Dokumen"
        description="Dokumen penting keluarga, tersimpan dan mudah ditemukan."
        action={
          <>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm",
                uploading && "opacity-50 cursor-wait",
              )}
              htmlFor="field-page-dashboarddocuments-0"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Unggah Dokumen
              <input
                type="file"
                className="sr-only"
                onChange={handleUpload}
                disabled={uploading}
                id="field-page-dashboarddocuments-0"
              />
            </label>
          </>
        }
      />

      {/* ── Search + filter kategori ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari nama dokumen"
            placeholder="Cari nama dokumen..."
            className="w-full rounded-xl border border-border dark:border-border bg-card dark:bg-card text-foreground dark:text-foreground pl-9 pr-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DOC_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors",
                typeFilter === value
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-card dark:bg-card text-foreground dark:text-foreground border-border dark:border-border hover:border-neutral-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Doc grid ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <QueryError retry={() => void refetch()} />
      ) : docs.length === 0 ? (
        <ContentState
          illustration={<EmptyIllustration name="documents" />}
          title={
            search || typeFilter
              ? "Dokumen belum ditemukan"
              : "Simpan yang penting, temukan dengan mudah"
          }
          description={
            search || typeFilter
              ? "Coba kata pencarian atau kategori lainnya."
              : "Unggah dokumen keluarga agar lebih mudah ditemukan saat dibutuhkan."
          }
          action={
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-medium text-white focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
              <Upload size={16} />
              Unggah dokumen
              <input
                type="file"
                className="sr-only"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="group relative rounded-xl border border-border dark:border-border bg-card dark:bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <FileIcon className="mb-2 h-8 w-8 text-primary-400" />
                <p className="text-sm font-semibold text-foreground dark:text-foreground break-words pr-8">
                  {doc.title}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs uppercase font-semibold text-muted-foreground">
                    {doc.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(doc.file_size)}
                  </span>
                </div>
              </a>
              <button
                onClick={() => {
                  if (window.confirm(`Hapus dokumen "${doc.title}"?`))
                    deleteDoc.mutate(doc.id);
                }}
                disabled={deleteDoc.isPending}
                aria-label={`Hapus ${doc.title}`}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-error-50 text-error-600 hover:bg-error-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
