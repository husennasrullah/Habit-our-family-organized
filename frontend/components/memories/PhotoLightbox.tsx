"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Memory } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

function resolvePhotoUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("/")) return `${API_BASE.replace(/\/api\/v1$/, "")}${url}`;
  return url;
}

interface PhotoLightboxProps {
  memory:     Memory;
  photoIndex: number;
  onClose:    () => void;
  onNavigate: (idx: number) => void;
}

export function PhotoLightbox({ memory, photoIndex, onClose, onNavigate }: PhotoLightboxProps) {
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
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   prev();
      if (e.key === "ArrowRight")  next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Prev */}
      {photoIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Image */}
      <div className="relative max-h-screen max-w-screen-lg px-16" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvePhotoUrl(current.url)}
          alt={current.caption || memory.title}
          className="max-h-[85vh] max-w-full rounded-lg object-contain"
        />
        {current.caption && (
          <p className="mt-2 text-center text-sm text-white/70">{current.caption}</p>
        )}
      </div>

      {/* Next */}
      {photoIndex < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onNavigate(i); }}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
