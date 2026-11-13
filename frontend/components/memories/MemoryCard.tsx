"use client";

import { format, parseISO } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import { Heart, ImageIcon, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Memory } from "@/types";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";

interface MemoryCardProps {
  memory: Memory;
  onEdit: (m: Memory) => void;
  onDelete: (m: Memory) => void;
  onOpen: (m: Memory) => void;
  onToggleFavorite: (m: Memory) => void;
}

function CoverPhoto({ url, alt }: { url: string; alt: string }) {
  const src = usePhotoUrl(url);
  if (!src)
    return (
      <div className="flex h-full items-center justify-center">
        <ImageIcon className="h-12 w-12 text-neutral-300" />
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}

export function MemoryCard({
  memory,
  onEdit,
  onDelete,
  onOpen,
  onToggleFavorite,
}: MemoryCardProps) {
  const coverPhoto = memory.photos?.[0];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card cursor-pointer hover:shadow-md transition-shadow">
      {/* Cover photo */}
      <div className="relative h-48 bg-muted overflow-hidden">
        <button
          onClick={() => onOpen(memory)}
          aria-label={`Buka kenangan ${memory.title}`}
          className="absolute inset-0 z-10 h-full w-full rounded-t-2xl"
        />
        {coverPhoto ? (
          <CoverPhoto url={coverPhoto.url} alt={memory.title} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-neutral-300" />
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-100 transition-opacity" />

        {/* Favorite + photo count */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
          {memory.photos.length > 1 && (
            <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
              {memory.photos.length} foto
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(memory);
            }}
            className="rounded-full bg-black/50 p-1.5 transition-colors hover:bg-black/70"
            aria-label="Toggle favorit"
          >
            <Heart
              className={cn(
                "h-4 w-4",
                memory.is_favorite
                  ? "fill-rose-500 text-rose-500"
                  : "text-white",
              )}
            />
          </button>
        </div>

        {/* Bottom actions */}
        <div className="absolute bottom-2 right-2 z-20 flex gap-1 opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(memory);
            }}
            aria-label={`Edit ${memory.title}`}
            className="rounded-full bg-card p-1.5 text-foreground hover:bg-card transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(memory);
            }}
            aria-label={`Hapus ${memory.title}`}
            className="rounded-full bg-card p-1.5 text-error-600 hover:bg-card transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="break-words text-sm font-semibold text-foreground">
          {memory.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground capitalize">
          {format(parseISO(memory.date), "d MMMM yyyy", { locale: dateLocale })}
        </p>
        {memory.content && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {memory.content}
          </p>
        )}
      </div>
    </div>
  );
}
