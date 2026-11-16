"use client";

import { ModalFrame } from "@/components/shared/ModalFrame";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Memory } from "@/types";
import { MemoryPhotoView } from "./MemoryPhotoView";

interface PhotoLightboxProps {
  memory: Memory;
  photoIndex: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
}

export function PhotoLightbox({
  memory,
  photoIndex,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  const photos = memory.photos;
  const current = photos[photoIndex];

  const prev = useCallback(() => {
    if (photoIndex > 0) onNavigate(photoIndex - 1);
  }, [photoIndex, onNavigate]);

  const next = useCallback(() => {
    if (photoIndex < photos.length - 1) onNavigate(photoIndex + 1);
  }, [photoIndex, photos.length, onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  if (!current) return null;

  return (
    <ModalFrame
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
      onClick={onClose}
      onClose={onClose}
      aria-label={`Foto kenangan ${memory.title}`}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Tutup"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Prev */}
      {photoIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-4 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-h-screen max-w-screen-lg px-16"
        onClick={(e) => e.stopPropagation()}
      >
        <MemoryPhotoView
          className="max-h-[75dvh] min-h-40 min-w-32 max-w-full rounded-lg object-contain"
          url={current.url}
          alt={current.caption || memory.title}
        />
        {current.caption && (
          <p className="mt-2 text-center text-sm text-white/70">
            {current.caption}
          </p>
        )}
      </div>

      {/* Next */}
      {photoIndex < photos.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-4 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Berikutnya"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm text-white"
        aria-live="polite"
      >
        {photoIndex + 1} dari {photos.length} foto
      </div>
    </ModalFrame>
  );
}
