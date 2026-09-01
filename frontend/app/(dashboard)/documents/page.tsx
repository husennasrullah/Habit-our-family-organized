"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, Trash2, Search, Loader2, FileIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { ApiResponse, Document } from "@/types";

const DOC_TYPES = [
  { value: "",         label: "Semua" },
  { value: "ktp",      label: "KTP" },
  { value: "kk",       label: "KK" },
  { value: "akta",     label: "Akta" },
  { value: "asuransi", label: "Asuransi" },
  { value: "bpjs",     label: "BPJS" },
  { value: "other",    label: "Lainnya" },
];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch]         = useState("");
  const [uploading, setUploading]   = useState(false);
  const qc = useQueryClient();

  const qs = new URLSearchParams();
  if (typeFilter) qs.set("type",   typeFilter);
  if (search)     qs.set("search", search);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documents", typeFilter, search],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Document[]>>(`/documents?${qs}`);
      return data.data ?? [];
    },
    staleTime: 30_000,
  });

  const deleteDoc = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/documents/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); toast.success("Dokumen dihapus"); },
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
      await api.post("/documents", form, { headers: { "Content-Type": "multipart/form-data" } });
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
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dokumen Keluarga</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Kelola dokumen penting keluarga dalam satu tempat yang aman.</p>
        </div>
        <label className={cn(
          "flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm",
          uploading && "opacity-50 cursor-wait"
        )}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Unggah Dokumen
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* ── Search + filter kategori ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama dokumen..."
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 pl-9 pr-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DOC_TYPES.map(({ value, label }) => (
            <button key={value} onClick={() => setTypeFilter(value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors",
                typeFilter === value
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Doc grid ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({length: 8}).map((_,i) => <Skeleton key={i} className="h-32 rounded-xl"/>)}
        </div>
      ) : docs.length === 0 ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-20 text-center px-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
              <svg className="h-8 w-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-3-3v6M5 8l2-2h10l2 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-base font-semibold text-neutral-700">Belum ada dokumen</p>
            <p className="mt-1.5 text-sm text-neutral-400 max-w-sm">
              Simpan scan KTP, Kartu Keluarga, atau polis asuransi agar mudah diakses kapan saja dibutuhkan.
            </p>
            <div className="mt-5 flex gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors">
                <Upload className="h-4 w-4" /> Mulai Unggah
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          </div>
          {/* Info bar bawah */}
          <div className="flex items-center gap-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100">
              <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary-700">Penyimpanan Terenkripsi</p>
              <p className="text-xs text-neutral-500">Semua dokumen Anda dienkripsi dan hanya dapat diakses oleh anggota keluarga yang Anda izinkan.</p>
            </div>
            <span className="text-xs font-semibold text-neutral-500">0 / 5.0 GB</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {docs.map((doc) => (
            <div key={doc.id} className="group relative rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 hover:shadow-sm transition-shadow">
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block">
                <FileIcon className="mb-2 h-8 w-8 text-primary-400"/>
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{doc.title}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase font-semibold text-neutral-500">{doc.type}</span>
                  <span className="text-xs text-neutral-400">{formatBytes(doc.file_size)}</span>
                </div>
              </a>
              <button
                onClick={() => deleteDoc.mutate(doc.id)}
                className="absolute top-2 right-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-error-50 text-error-600 hover:bg-error-100"
              >
                <Trash2 className="h-3.5 w-3.5"/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
