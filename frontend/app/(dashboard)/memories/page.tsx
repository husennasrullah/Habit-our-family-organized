"use client";
import { useMemo, useState, useEffect } from "react";
import { useCalendarContext } from "@/hooks/useCalendarContext";
import { Heart, Images, Plus, Search, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { PageHeader } from "@/components/shared/PageHeader";
import { ModalFrame } from "@/components/shared/ModalFrame";
import { ContentState } from "@/components/shared/ContentState";
import { EmptyIllustration } from "@/components/shared/EmptyIllustration";
import { QueryError } from "@/components/shared/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MemoryCard } from "@/components/memories/MemoryCard";
import {
  MemoryModal,
  MemoryFormValues,
} from "@/components/memories/MemoryModal";
import { MemoryPhotoView } from "@/components/memories/MemoryPhotoView";
import { PhotoLightbox } from "@/components/memories/PhotoLightbox";
import {
  useMemories,
  useCreateMemory,
  useUpdateMemory,
  useDeleteMemory,
  useUploadPhotos,
  useDeletePhoto,
} from "@/hooks/useMemories";
import type { Memory, MemoryPhoto } from "@/types";
function message(e: unknown, fallback: string) {
  const err = e as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };
  return err?.response?.data?.message ?? fallback;
}
export default function MemoriesPage() {
  const context = useCalendarContext();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === "admin" || user?.role === "member";
  const { data: memories = [], isLoading, isError, refetch } = useMemories();
  const create = useCreateMemory(),
    update = useUpdateMemory(),
    remove = useDeleteMemory(),
    upload = useUploadPhotos(),
    removePhoto = useDeletePhoto();
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{
    memory: Memory | null;
    key: number;
  } | null>(null);
  const [detail, setDetail] = useState<Memory | null>(null);
  const [photoIdx, setPhotoIdx] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Memory | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const years = useMemo(
    () =>
      Array.from(new Set(memories.map((m) => m.date.slice(0, 4))))
        .sort()
        .reverse(),
    [memories],
  );
  const filtered = memories.filter(
    (m) =>
      (!year || m.date.startsWith(year)) &&
      (!month || m.date.slice(5, 7) === month) &&
      (!favorite || m.is_favorite) &&
      `${m.title} ${m.content}`
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );
  const photos = memories.reduce(
    (n, m) =>
      n +
      m.photos.filter((p) => !p.storage_delete_pending && !p.upload_pending)
        .length,
    0,
  );
  const startEdit = async (m: Memory | null) => {
    setError("");
    if (!m) {
      setEditor({ memory: null, key: Date.now() });
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.get<{
        data: Memory;
      }>(`/memories/${m.id}`);
      setDetail(null);
      setEditor({ memory: data.data, key: Date.now() });
    } catch (e) {
      toast.error(message(e, "Gagal membuka kenangan"));
    } finally {
      setBusy(false);
    }
  };
  const refreshEditor = async (id: string) => {
    const { data } = await api.get<{
      data: Memory;
    }>(`/memories/${id}`);
    setEditor((current) =>
      current ? { ...current, memory: data.data } : null,
    );
  };
  const save = async (values: MemoryFormValues, files: File[]) => {
    setBusy(true);
    setError("");
    let id = editor?.memory?.id;
    try {
      const saved = id
        ? await update.mutateAsync({ id, ...values })
        : await create.mutateAsync(values);
      id = saved.id;
      // Keep the persisted ID even if photos fail, so retry never creates another journal entry.
      setEditor((current) =>
        current
          ? {
              ...current,
              memory: { ...saved, photos: current.memory?.photos ?? [] },
            }
          : null,
      );
      if (files.length) await upload.mutateAsync({ memoryId: id, files });
      setEditor(null);
      toast.success("Kenangan tersimpan");
    } catch (e) {
      setError(
        message(
          e,
          "Gagal menyimpan. Isian tetap tersimpan di form, silakan coba lagi.",
        ),
      );
      if (id)
        try {
          await refreshEditor(id);
        } catch {
          /* Keep the draft if the read also fails. */
        }
    } finally {
      setBusy(false);
    }
  };
  const deletePhoto = async (p: MemoryPhoto) => {
    if (!editor?.memory || !window.confirm("Hapus foto ini dari kenangan?"))
      return;
    setBusy(true);
    setError("");
    const id = editor.memory.id;
    try {
      await removePhoto.mutateAsync({ memoryId: id, photoId: p.id });
      await refreshEditor(id);
    } catch (e) {
      setError(message(e, "Foto belum dapat dihapus"));
      try {
        await refreshEditor(id);
      } catch {
        /* Keep retry available. */
      }
    } finally {
      setBusy(false);
    }
  };
  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    setDeleteError("");
    try {
      await remove.mutateAsync(deleting.id);
      setDeleting(null);
      toast.success("Kenangan dihapus");
    } catch (e) {
      setDeleteError(
        message(e, "Penghapusan belum selesai. Silakan coba lagi."),
      );
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (m: Memory) => {
    setBusy(true);
    try {
      await update.mutateAsync({ id: m.id, is_favorite: !m.is_favorite });
    } catch (e) {
      toast.error(message(e, "Gagal memperbarui favorit"));
    } finally {
      setBusy(false);
    }
  };
  const open = async (m: Memory) => {
    setBusy(true);
    try {
      const { data } = await api.get<{
        data: Memory;
      }>(`/memories/${m.id}`);
      setDetail(data.data);
    } catch (e) {
      toast.error(message(e, "Gagal memuat cerita"));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!context.record) return;
    let live = true;
    setBusy(true);
    void api
      .get<{ data: Memory }>(`/memories/${encodeURIComponent(context.record)}`)
      .then(({ data }) => {
        if (live) setDetail(data.data);
      })
      .catch(() => {
        if (live) toast.error("Kenangan tidak lagi tersedia");
      })
      .finally(() => {
        if (live) setBusy(false);
      });
    return () => {
      live = false;
    };
  }, [context.record]);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Kenangan"
        description="Momen sederhana, cerita yang tinggal selamanya."
        action={
          canEdit ? (
            <Button disabled={busy} onClick={() => startEdit(null)}>
              <Plus size={16} className="mr-2" />
              Tambah kenangan
            </Button>
          ) : undefined
        }
      />
      <section className="relative overflow-hidden rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50 via-card to-amber-50 p-5 dark:border-primary-800 dark:from-primary-950 dark:via-card dark:to-neutral-900 sm:p-6">
        <div className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 rounded-full border-[20px] border-primary-200/30 dark:border-primary-700/20" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card text-primary-600 shadow-sm dark:text-primary-300">
            <Images size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-700 dark:text-primary-200">
              Album cerita keluarga
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              Hal kecil yang ingin kita ingat.
            </h2>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">
              Dari hari biasa sampai petualangan bersama. Simpan foto dan
              ceritanya di satu tempat.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                {memories.length} kenangan
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                {photos} foto
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                {memories.filter((m) => m.is_favorite).length} favorit
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <label className="relative min-w-0 flex-1 basis-48">
          <Search
            size={15}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <input
            aria-label="Cari kenangan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul atau cerita…"
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
          />
        </label>
        <select
          aria-label="Tahun kenangan"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="h-11 max-w-full rounded-lg border border-border bg-background px-3 text-xs"
        >
          <option value="">Semua tahun</option>
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <select
          aria-label="Bulan kenangan"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-11 max-w-full rounded-lg border border-border bg-background px-3 text-xs"
        >
          <option value="">Semua bulan</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={String(i + 1).padStart(2, "0")}>
              {new Intl.DateTimeFormat("id-ID", { month: "long" }).format(
                new Date(2026, i, 1),
              )}
            </option>
          ))}
        </select>
        <button
          aria-pressed={favorite}
          onClick={() => setFavorite(!favorite)}
          className={`flex h-11 items-center gap-2 rounded-lg border px-3 text-xs ${favorite ? "border-primary-600 bg-primary-600 text-white" : "border-border"}`}
        >
          <Heart size={15} className={favorite ? "fill-current" : ""} />
          Favorit
        </button>
      </div>
      {busy && !editor && !deleting && (
        <p
          role="status"
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Loader2 size={14} className="animate-spin" />
          Memproses kenangan…
        </p>
      )}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <QueryError retry={() => void refetch()} />
      ) : !filtered.length ? (
        <ContentState
          illustration={<EmptyIllustration name="album" />}
          title={
            memories.length
              ? "Belum ada cerita di pilihan ini"
              : "Cerita pertama dimulai di sini"
          }
          description="Satu foto atau sepenggal cerita sudah cukup untuk memulai."
          action={
            memories.length ? (
              <Button
                variant="outline"
                onClick={() => {
                  setYear("");
                  setMonth("");
                  setSearch("");
                  setFavorite(false);
                }}
              >
                Reset filter
              </Button>
            ) : canEdit ? (
              <Button onClick={() => startEdit(null)}>
                Tambah kenangan pertama
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} kenangan untuk dikenang kembali
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => (
              <MemoryCard
                key={m.id}
                memory={m}
                canEdit={canEdit}
                busy={busy}
                onOpen={open}
                onEdit={startEdit}
                onDelete={(m) => {
                  setDeleteError("");
                  setDeleting(m);
                }}
                onToggleFavorite={toggle}
              />
            ))}
          </div>
        </>
      )}
      {editor && (
        <MemoryModal
          key={editor.key}
          memory={editor.memory}
          busy={busy}
          error={error}
          onClose={() => setEditor(null)}
          onSave={save}
          onDeletePhoto={deletePhoto}
        />
      )}
      {detail && (
        <ModalFrame
          onClose={() => {
            if (!busy) setDetail(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
        >
          <section className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card">
            <header className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {detail.date.slice(0, 10).split("-").reverse().join(" / ")}
                </p>
                <h2 className="mt-1 break-words text-lg font-semibold">
                  {detail.title}
                </h2>
              </div>
              <button
                disabled={busy}
                onClick={() => setDetail(null)}
                aria-label="Tutup cerita"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-muted"
              >
                <X size={18} />
              </button>
            </header>
            <div className="space-y-4 p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {detail.content || "Momen ini tersimpan lewat foto-fotonya."}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {detail.photos
                  .filter((p) => !p.storage_delete_pending && !p.upload_pending)
                  .map((p, i) => (
                    <div
                      key={p.id}
                      className="overflow-hidden rounded-xl border border-border"
                    >
                      <MemoryPhotoView
                        url={p.url}
                        alt={p.caption || `Foto ${i + 1} ${detail.title}`}
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        onClick={() => setPhotoIdx(i)}
                        aria-label={`Perbesar foto ${i + 1}`}
                        className="min-h-11 w-full bg-muted text-xs"
                      >
                        Lihat foto {i + 1}
                      </button>
                    </div>
                  ))}
              </div>
              {canEdit && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => startEdit(detail)}
                >
                  Edit kenangan
                </Button>
              )}
            </div>
          </section>
        </ModalFrame>
      )}
      {detail && photoIdx !== null && (
        <PhotoLightbox
          memory={{
            ...detail,
            photos: detail.photos.filter(
              (p) => !p.storage_delete_pending && !p.upload_pending,
            ),
          }}
          photoIndex={photoIdx}
          onClose={() => setPhotoIdx(null)}
          onNavigate={setPhotoIdx}
        />
      )}
      {deleting && (
        <ModalFrame
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
        >
          <section className="w-full max-w-[360px] space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Hapus kenangan ini?</h2>
            <p className="break-words text-sm text-muted-foreground">
              “{deleting.title}” beserta semua fotonya akan dihapus.
            </p>
            {deleteError && (
              <p
                role="alert"
                className="text-xs text-red-700 dark:text-red-300"
              >
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                Batal
              </Button>
              <Button disabled={busy} onClick={doDelete}>
                {busy
                  ? "Menghapus…"
                  : deleteError
                    ? "Coba hapus lagi"
                    : "Hapus kenangan"}
              </Button>
            </div>
          </section>
        </ModalFrame>
      )}
    </div>
  );
}
