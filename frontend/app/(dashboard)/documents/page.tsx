"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Upload,
  Trash2,
  Search,
  FileText,
  Download,
  Pencil,
  Eye,
  X,
  LockKeyhole,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContentState } from "@/components/shared/ContentState";
import { EmptyIllustration } from "@/components/shared/EmptyIllustration";
import { QueryError } from "@/components/shared/QueryError";
import { ModalFrame } from "@/components/shared/ModalFrame";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { ApiResponse, Document } from "@/types";

const kinds = [
  { value: "ktp", label: "KTP" },
  { value: "kk", label: "KK" },
  { value: "akta", label: "Akta" },
  { value: "asuransi", label: "Asuransi" },
  { value: "bpjs", label: "BPJS" },
  { value: "other", label: "Lainnya" },
];
const metadata = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Nama dokumen wajib diisi")
    .max(160, "Nama maksimal 160 karakter"),
  type: z.enum(["ktp", "kk", "akta", "asuransi", "bpjs", "other"]),
  tags: z.string().trim().max(300, "Tag maksimal 300 karakter"),
});
const maxBytes = 10 * 1024 * 1024;
function size(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
function errorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || fallback
  );
}

function documentFilename(doc: Document, type: string) {
  const extension: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  return doc.file_name || doc.title + (extension[type] || "");
}

export default function DocumentsPage() {
  const user = useAuthStore((s) => s.user);
  const allowed = user?.role === "admin" || user?.role === "member";
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [kind, setKind] = useState("");
  const [form, setForm] = useState<Document | "new" | null>(null);
  const [deleting, setDeleting] = useState<Document | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    type: string;
    title: string;
    filename: string;
  } | null>(null);
  const qc = useQueryClient();
  const objectURL = useRef<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(
    () => () => {
      if (objectURL.current) URL.revokeObjectURL(objectURL.current);
    },
    [],
  );
  const query = useQuery({
    queryKey: ["documents", user?.family_id, kind, debounced],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Document[]>>("/documents", {
        params: { type: kind, search: debounced },
      });
      return data.data;
    },
  });
  const capabilities = useQuery({
    queryKey: ["documents-capabilities"],
    enabled: allowed,
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<{ encryption_available: boolean }>
      >("/documents/capabilities");
      return data.data;
    },
  });
  const remove = useMutation({
    mutationFn: async (doc: Document) => {
      await api.delete(`/documents/${doc.id}`);
    },
    onSuccess: () => {
      setDeleting(null);
      toast.success("Dokumen dan file berhasil dihapus");
    },
    onError: (e) => {
      setDeleting(null);
      toast.error(errorMessage(e, "Gagal menghapus dokumen"));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
  const closePreview = () => {
    setPreview(null);
    if (objectURL.current) {
      URL.revokeObjectURL(objectURL.current);
      objectURL.current = null;
    }
  };
  async function openFile(doc: Document, download: boolean) {
    setBusy(doc.id);
    try {
      const res = await api.get<Blob>(`/documents/${doc.id}/download`, {
        responseType: "blob",
        params: { preview: !download },
      });
      const type =
        String(res.headers["content-type"] || "").split(";")[0] ||
        doc.content_type ||
        "application/octet-stream";
      const url = URL.createObjectURL(new Blob([res.data], { type }));
      if (download) {
        const link = document.createElement("a");
        link.href = url;
        link.download = documentFilename(doc, type);
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        if (objectURL.current) URL.revokeObjectURL(objectURL.current);
        objectURL.current = url;
        setPreview({
          url,
          type,
          title: doc.title,
          filename: documentFilename(doc, type),
        });
      }
    } catch (e) {
      let message = "File belum dapat dibuka. Coba lagi.";
      const response = (e as { response?: { data?: Blob } }).response?.data;
      if (response instanceof Blob) {
        try {
          message = JSON.parse(await response.text()).message || message;
        } catch {
          /* Non-JSON error response. */
        }
      }
      toast.error(message);
    } finally {
      setBusy(null);
    }
  }
  if (!allowed)
    return (
      <ContentState
        title="Dokumen khusus anggota dewasa"
        description="Masuk dengan akun admin atau anggota dewasa untuk mengelola dokumen keluarga."
      />
    );
  const docs = query.data || [];
  return (
    <div className="space-y-4">
      <PageHeader
        title="Dokumen"
        description="Yang penting tersimpan. Saat dibutuhkan, mudah ditemukan."
        action={
          <Button onClick={() => setForm("new")}>
            <Upload size={15} />
            Unggah dokumen
          </Button>
        }
      />
      <div className="documents-banner">
        <span className="documents-banner-icon">
          <FolderOpen size={26} />
        </span>
        <div>
          <h2>Ruang untuk dokumen keluarga</h2>
          <p>
            Simpan PDF dan foto penting, kelompokkan, lalu temukan kembali kapan
            saja.
          </p>
          <span>
            <LockKeyhole size={12} /> Akses file melalui akun keluarga
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 w-full sm:max-w-xs">
          <Search
            className="absolute left-3 top-3 text-muted-foreground"
            size={16}
          />
          <input
            aria-label="Cari nama atau tag dokumen"
            placeholder="Cari nama atau tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="documents-search"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Kategori dokumen">
          {[{ value: "", label: "Semua" }, ...kinds].map((k) => (
            <button
              key={k.value}
              aria-pressed={kind === k.value}
              onClick={() => setKind(k.value)}
              className={`documents-filter ${kind === k.value ? "is-active" : ""}`}
            >
              {k.label}
            </button>
          ))}
        </div>
        {query.isFetching && !query.isLoading && (
          <Loader2
            size={16}
            className="animate-spin"
            aria-label="Memperbarui dokumen"
          />
        )}
      </div>
      {query.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <QueryError retry={() => void query.refetch()} />
      ) : !docs.length ? (
        <ContentState
          illustration={<EmptyIllustration name="documents" />}
          title={
            search || kind
              ? "Dokumen belum ditemukan"
              : "Simpan yang penting, temukan dengan mudah"
          }
          description={
            search || kind
              ? "Coba nama, tag, atau kategori lainnya."
              : "Mulai dari kartu keluarga, akta, atau dokumen penting lainnya."
          }
          action={
            <Button
              onClick={() => {
                if (search || kind) {
                  setSearch("");
                  setKind("");
                } else setForm("new");
              }}
            >
              {search || kind ? "Reset pencarian" : "Unggah dokumen pertama"}
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {docs.length} dokumen
            {kind || debounced ? " ditemukan" : " dalam keluarga"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {docs.map((doc) => (
              <article key={doc.id} className="documents-card">
                <div className="flex items-start justify-between gap-3">
                  <span className="documents-file-icon">
                    <FileText size={23} />
                  </span>
                  <span className="documents-category">
                    {kinds.find((k) => k.value === doc.type)?.label ||
                      "Lainnya"}
                  </span>
                </div>
                <h2 className="mt-3 break-words text-sm font-semibold">
                  {doc.title}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {size(doc.file_size)} ·{" "}
                  {new Date(doc.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {doc.tags && (
                  <p className="mt-2 break-words text-xs text-muted-foreground">
                    {doc.tags}
                  </p>
                )}
                {doc.is_encrypted && (
                  <span className="documents-encrypted">
                    <LockKeyhole size={12} /> Terenkripsi
                  </span>
                )}
                {doc.storage_delete_pending ? (
                  <div className="mt-3">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      Penghapusan file belum selesai. Dokumen sudah tidak dapat
                      dibuka.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      disabled={remove.isPending}
                      onClick={() => setDeleting(doc)}
                    >
                      Coba hapus lagi
                    </Button>
                  </div>
                ) : (
                  <div className="documents-actions">
                    <button
                      disabled={busy !== null}
                      onClick={() => void openFile(doc, false)}
                      aria-label={`Pratinjau ${doc.title}`}
                    >
                      <Eye size={16} />
                      <span>Lihat</span>
                    </button>
                    <button
                      disabled={busy !== null}
                      onClick={() => void openFile(doc, true)}
                      aria-label={`Unduh ${doc.title}`}
                    >
                      {busy === doc.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      <span>Unduh</span>
                    </button>
                    <button
                      onClick={() => setForm(doc)}
                      aria-label={`Edit ${doc.title}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleting(doc)}
                      aria-label={`Hapus ${doc.title}`}
                      className="documents-delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}
      {form && (
        <DocumentForm
          key={typeof form === "string" ? form : form.id}
          doc={form === "new" ? null : form}
          encryptionAvailable={capabilities.data?.encryption_available === true}
          capabilityError={capabilities.isError}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            void qc.invalidateQueries({ queryKey: ["documents"] });
          }}
        />
      )}
      {deleting && (
        <ModalFrame
          onClose={() => {
            if (!remove.isPending) setDeleting(null);
          }}
          className="documents-overlay"
        >
          <div className="documents-dialog">
            <h2>Hapus dokumen?</h2>
            <p className="mt-3 text-sm text-muted-foreground break-words">
              “{deleting.title}” dan file aslinya akan dihapus. Tindakan ini
              tidak dapat dibatalkan.
            </p>
            <div className="documents-dialog-actions">
              <Button
                variant="outline"
                disabled={remove.isPending}
                onClick={() => setDeleting(null)}
              >
                Batal
              </Button>
              <Button
                loading={remove.isPending}
                className="bg-red-700 hover:bg-red-800"
                onClick={() => remove.mutate(deleting)}
              >
                Hapus dokumen
              </Button>
            </div>
          </div>
        </ModalFrame>
      )}
      {preview && (
        <ModalFrame className="documents-overlay" onClose={closePreview}>
          <div className="documents-preview">
            <div className="flex items-center justify-between gap-3 p-4">
              <h2 className="break-words">{preview.title}</h2>
              <button
                className="documents-close"
                aria-label="Tutup pratinjau"
                onClick={closePreview}
              >
                <X size={18} />
              </button>
            </div>
            {preview.type.startsWith("image/") ? (
              <div className="documents-image-preview">
                <Image
                  src={preview.url}
                  alt={preview.title}
                  width={1200}
                  height={900}
                  unoptimized
                />
              </div>
            ) : preview.type === "application/pdf" ? (
              <>
                <p className="px-4 pb-3 text-xs text-muted-foreground">
                  Jika pratinjau PDF tidak didukung perangkat, gunakan tombol
                  Unduh.
                </p>
                <iframe
                  title={`Pratinjau ${preview.title}`}
                  src={preview.url}
                  className="h-[60svh] w-full"
                />
              </>
            ) : (
              <p className="p-4">Pratinjau tidak tersedia untuk format ini.</p>
            )}
            <div className="p-4">
              <a
                href={preview.url}
                download={preview.filename}
                className="documents-download-link"
              >
                <Download size={16} />
                Unduh file
              </a>
            </div>
          </div>
        </ModalFrame>
      )}
    </div>
  );
}

function DocumentForm({
  doc,
  encryptionAvailable,
  capabilityError,
  onClose,
  onSaved,
}: {
  doc: Document | null;
  encryptionAvailable: boolean;
  capabilityError: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(doc?.title || "");
  const [kind, setKind] = useState(doc?.type || "other");
  const [tags, setTags] = useState(doc?.tags || "");
  const [file, setFile] = useState<File | null>(null);
  const [encrypted, setEncrypted] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  function pick(f: File | undefined) {
    if (!f) return;
    setFile(null);
    if (f.size === 0 || f.size > maxBytes) {
      setError("Pilih file berukuran 1 byte sampai 10 MB.");
      return;
    }
    if (!/\.(pdf|jpe?g|png|webp)$/i.test(f.name)) {
      setError("Gunakan PDF, JPG, PNG, atau WebP.");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    setError("");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    const parsed = metadata.safeParse({ title, type: kind, tags });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (!doc && !file) {
      setError("Pilih file terlebih dahulu.");
      return;
    }
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      if (doc) {
        await api.put(`/documents/${doc.id}`, parsed.data);
      } else {
        const body = new FormData();
        body.append("file", file!);
        body.append("title", parsed.data.title);
        body.append("type", parsed.data.type);
        body.append("tags", parsed.data.tags);
        body.append("is_encrypted", String(encrypted));
        await api.post("/documents", body, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      toast.success(doc ? "Dokumen diperbarui" : "Dokumen berhasil diunggah");
      onSaved();
    } catch (e) {
      setError(errorMessage(e, "Gagal menyimpan dokumen. Coba lagi."));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  return (
    <ModalFrame
      className="documents-overlay"
      onClose={() => {
        if (!pending.current) onClose();
      }}
    >
      <div className="documents-dialog">
        <div className="flex justify-between items-center gap-3">
          <h2>{doc ? "Edit dokumen" : "Unggah dokumen"}</h2>
          <button
            disabled={saving}
            onClick={onClose}
            className="documents-close"
            aria-label="Tutup form dokumen"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          {!doc && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!saving) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (!saving) pick(e.dataTransfer.files[0]);
              }}
              className={`documents-drop ${dragging ? "is-dragging" : ""}`}
            >
              <input
                ref={input}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                disabled={saving}
                className="sr-only"
                id="document-file"
                aria-label="File dokumen"
                onChange={(e) => {
                  pick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Upload size={22} />
              <button
                type="button"
                disabled={saving}
                onClick={() => input.current?.click()}
              >
                {file ? file.name : "Pilih file atau tarik ke sini"}
              </button>
              <p>
                {file ? size(file.size) : "PDF, JPG, PNG, WebP · Maks. 10 MB"}
              </p>
            </div>
          )}
          <label className="documents-field" htmlFor="document-title">
            Nama dokumen
            <input
              id="document-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              required
              disabled={saving}
              placeholder="Contoh: Kartu Keluarga"
            />
          </label>
          <label className="documents-field" htmlFor="document-type">
            Kategori
            <select
              id="document-type"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              disabled={saving}
            >
              {kinds.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label className="documents-field" htmlFor="document-tags">
            Tag{" "}
            <span className="font-normal text-muted-foreground">
              (opsional)
            </span>
            <input
              id="document-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              maxLength={300}
              disabled={saving}
              placeholder="Contoh: ayah, identitas"
            />
          </label>
          {!doc && (
            <div className="documents-sensitive">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={encrypted}
                  onChange={(e) => setEncrypted(e.target.checked)}
                  disabled={!encryptionAvailable || saving}
                />
                <span>
                  Dokumen sensitif
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    {encryptionAvailable
                      ? "Enkripsi tambahan saat file disimpan. Hanya dibuka melalui akun keluarga."
                      : capabilityError
                        ? "Status enkripsi belum dapat diperiksa. Tutup dan coba lagi."
                        : "Enkripsi tambahan belum tersedia. Admin server perlu mengaktifkannya."}
                  </p>
                </span>
              </label>
            </div>
          )}
          {doc?.is_encrypted && (
            <p className="text-xs text-muted-foreground">
              File ini tetap terenkripsi. Edit hanya mengubah nama, kategori dan
              tag.
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="documents-dialog-actions">
            <Button
              variant="outline"
              type="button"
              disabled={saving}
              onClick={onClose}
            >
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {doc ? "Simpan perubahan" : "Unggah dokumen"}
            </Button>
          </div>
        </form>
      </div>
    </ModalFrame>
  );
}
