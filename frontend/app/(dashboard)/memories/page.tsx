"use client";

import { ContentState } from "@/components/shared/ContentState";
import { EmptyIllustration } from "@/components/shared/EmptyIllustration";
import { QueryError } from "@/components/shared/QueryError";
import { PageHeader } from "@/components/shared/PageHeader";
import { useState, useCallback } from "react";
import { Plus, Heart } from "lucide-react";
import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MemoryCard } from "@/components/memories/MemoryCard";
import {
  MemoryModal,
  type MemoryFormValues,
} from "@/components/memories/MemoryModal";
import { PhotoLightbox } from "@/components/memories/PhotoLightbox";
import {
  useMemories,
  useCreateMemory,
  useUpdateMemory,
  useDeleteMemory,
  useUploadPhotos,
} from "@/hooks/useMemories";
import type { Memory } from "@/types";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function MemoriesPage() {
  const [yearFilter, setYearFilter] = useState<number | undefined>();
  const [favFilter, setFavFilter] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  // Lightbox state
  const [lightboxMemory, setLightboxMemory] = useState<Memory | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);

  const {
    data: memories = [],
    isLoading,
    isError,
    refetch,
  } = useMemories(yearFilter, undefined, favFilter || undefined);
  const createMemory = useCreateMemory();
  const updateMemory = useUpdateMemory();
  const deleteMemory = useDeleteMemory();
  const uploadPhotos = useUploadPhotos();

  const handleSave = async (
    values: MemoryFormValues,
    pendingFiles?: File[],
  ) => {
    try {
      const saved = selectedMemory
        ? await updateMemory.mutateAsync({ id: selectedMemory.id, ...values })
        : await createMemory.mutateAsync(values);
      setModalOpen(false);
      toast.success(
        selectedMemory ? "Kenangan diperbarui" : "Kenangan ditambahkan",
      );
      const memoryId = selectedMemory?.id ?? saved?.id;
      if (pendingFiles?.length && memoryId) {
        try {
          await uploadPhotos.mutateAsync({ memoryId, files: pendingFiles });
        } catch {
          toast.error(
            "Kenangan tersimpan, tetapi foto belum terunggah. Tambahkan kembali melalui Edit kenangan.",
          );
        }
      }
    } catch {
      toast.error("Gagal menyimpan kenangan");
    }
  };

  const handleDelete = async (memoryToDelete?: Memory | null) => {
    const target = memoryToDelete ?? selectedMemory;
    if (!target || !window.confirm(`Hapus kenangan "${target.title}"?`)) return;
    try {
      await deleteMemory.mutateAsync(target.id);
      toast.success("Kenangan dihapus");
      setModalOpen(false);
    } catch {
      toast.error("Gagal menghapus kenangan");
    }
  };

  const openLightbox = useCallback(async (memory: Memory, idx = 0) => {
    if (!memory.photos.length) return;
    // Fetch detail memory untuk mendapatkan semua foto (list hanya load 1 cover)
    try {
      const { data } = await import("@/lib/api").then((m) =>
        m.api.get<{ data: Memory }>(`/memories/${memory.id}`),
      );
      setLightboxMemory(data.data);
    } catch {
      setLightboxMemory(memory);
    }
    setPhotoIdx(idx);
  }, []);

  const handleToggleFavorite = useCallback(
    async (memory: Memory) => {
      try {
        await updateMemory.mutateAsync({
          id: memory.id,
          is_favorite: !memory.is_favorite,
        });
      } catch {
        toast.error("Gagal memperbarui favorit");
      }
    },
    [updateMemory],
  );

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <PageHeader
        title="Kenangan"
        description="Cerita kecil hari ini, kenangan berharga nanti."
        action={
          <>
            <button
              onClick={() => {
                setSelectedMemory(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah Kenangan
            </button>
          </>
        }
      />

      {/* ── Filters — sesuai mockup: tab pill ───────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Favorit toggle */}
        <button
          onClick={() => setFavFilter((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
            favFilter
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-card dark:bg-card text-foreground dark:text-foreground border-border dark:border-border hover:border-neutral-300",
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", favFilter && "fill-current")} />
          Favorit
        </button>

        {/* Year filter */}
        <button
          onClick={() => setYearFilter(undefined)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
            !yearFilter
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-card dark:bg-card text-foreground dark:text-foreground border-border dark:border-border hover:border-neutral-300",
          )}
        >
          Semua
        </button>
        {YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setYearFilter(yearFilter === y ? undefined : y)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
              yearFilter === y
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-card dark:bg-card text-foreground dark:text-foreground border-border dark:border-border hover:border-neutral-300",
            )}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <QueryError retry={() => void refetch()} />
      ) : memories.length === 0 ? (
        <ContentState
          illustration={<EmptyIllustration name="album" />}
          title={
            yearFilter || favFilter
              ? "Belum ada kenangan di pilihan ini"
              : "Cerita pertama dimulai di sini"
          }
          description="Foto, cerita singkat, atau momen sederhana. Simpan agar bisa dikenang bersama."
          action={
            <button
              onClick={() => {
                setSelectedMemory(null);
                setModalOpen(true);
              }}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-medium text-white"
            >
              <Plus size={16} />
              Tambah kenangan
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onEdit={(m) => {
                setSelectedMemory(m);
                setModalOpen(true);
              }}
              onDelete={(m) => handleDelete(m)}
              onOpen={(m) => openLightbox(m, 0)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <MemoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={selectedMemory ? handleDelete : undefined}
        memory={selectedMemory}
        isSaving={createMemory.isPending || updateMemory.isPending}
        isDeleting={deleteMemory.isPending}
      />

      {/* Lightbox */}
      {lightboxMemory && (
        <PhotoLightbox
          memory={lightboxMemory}
          photoIndex={photoIdx}
          onClose={() => setLightboxMemory(null)}
          onNavigate={setPhotoIdx}
        />
      )}
    </div>
  );
}
