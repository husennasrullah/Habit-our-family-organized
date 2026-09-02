"use client";

import { useState, useCallback } from "react";
import { Plus, Heart } from "lucide-react";
import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MemoryCard } from "@/components/memories/MemoryCard";
import { MemoryModal, type MemoryFormValues } from "@/components/memories/MemoryModal";
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
  const [yearFilter, setYearFilter]       = useState<number | undefined>();
  const [favFilter, setFavFilter]         = useState(false);
  const [modalOpen, setModalOpen]         = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  // Lightbox state
  const [lightboxMemory, setLightboxMemory] = useState<Memory | null>(null);
  const [photoIdx, setPhotoIdx]             = useState(0);

  const { data: memories = [], isLoading } = useMemories(yearFilter, undefined, favFilter || undefined);
  const createMemory  = useCreateMemory();
  const updateMemory  = useUpdateMemory();
  const deleteMemory  = useDeleteMemory();
  const uploadPhotos  = useUploadPhotos();

  const handleSave = async (values: MemoryFormValues, pendingFiles?: File[]) => {
    try {
      if (selectedMemory) {
        await updateMemory.mutateAsync({ id: selectedMemory.id, ...values });
        toast.success("Kenangan diperbarui");
        setModalOpen(false);
      } else {
        const created = await createMemory.mutateAsync(values);
        // Selalu close modal dulu, upload foto di background
        setModalOpen(false);
        toast.success("Kenangan ditambahkan 🎉");
        // Upload foto jika ada — error tidak blokir modal close
        if (pendingFiles?.length && created?.id) {
          try {
            await uploadPhotos.mutateAsync({ memoryId: created.id, files: pendingFiles });
          } catch {
            toast.error("Kenangan tersimpan tapi foto gagal diupload — coba upload lagi dari edit kenangan");
          }
        }
      }
    } catch {
      toast.error("Gagal menyimpan kenangan");
    }
  };

  const handleDelete = async (memoryToDelete?: Memory | null) => {
    const target = memoryToDelete ?? selectedMemory;
    if (!target) return;
    try {
      await deleteMemory.mutateAsync(target.id);
      toast.success("Kenangan dihapus");
      setModalOpen(false);
    } catch {
      toast.error("Gagal menghapus kenangan");
    }
  };

  const openLightbox = useCallback((memory: Memory, idx = 0) => {
    if (!memory.photos.length) return;
    setLightboxMemory(memory);
    setPhotoIdx(idx);
  }, []);

  const handleToggleFavorite = useCallback(async (memory: Memory) => {
    try {
      await updateMemory.mutateAsync({ id: memory.id, is_favorite: !memory.is_favorite });
    } catch {
      toast.error("Gagal memperbarui favorit");
    }
  }, [updateMemory]);

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Kenangan Keluarga</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Simpan momen berharga yang tumbuh bersama.</p>
        </div>
        <button
          onClick={() => { setSelectedMemory(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Tambah Kenangan
        </button>
      </div>

      {/* ── Filters — sesuai mockup: tab pill ───────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Favorit toggle */}
        <button
          onClick={() => setFavFilter((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
            favFilter
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
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
              : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
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
                : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
            )}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-20 text-center px-8">
          {/* Ilustrasi tree sederhana sesuai mockup */}
          <div className="mb-5 flex flex-col items-center">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-teal-200">
              <ellipse cx="40" cy="28" rx="22" ry="18" fill="currentColor" opacity="0.5"/>
              <ellipse cx="25" cy="22" rx="13" ry="10" fill="currentColor" opacity="0.4"/>
              <ellipse cx="55" cy="20" rx="11" ry="9" fill="currentColor" opacity="0.3"/>
              <line x1="40" y1="44" x2="40" y2="68" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round"/>
              <line x1="40" y1="54" x2="30" y2="46" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
              <line x1="40" y1="50" x2="50" y2="44" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-base font-semibold text-neutral-700">Belum ada kenangan</p>
          <p className="mt-1.5 text-sm text-neutral-400 max-w-xs">
            Klik <strong>&quot;Tambah Kenangan&quot;</strong> untuk mencatat momen pertama keluarga — foto, catatan, atau cerita singkat.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onEdit={(m) => { setSelectedMemory(m); setModalOpen(true); }}
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
