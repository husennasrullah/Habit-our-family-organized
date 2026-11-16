"use client";
import { CalendarDateLink } from "@/components/shared/CalendarDateLink";
import { Heart, ImageIcon, Pencil, Trash2 } from "lucide-react";
import { MemoryPhotoView } from "./MemoryPhotoView";
import type { Memory } from "@/types";
interface Props {
  memory: Memory;
  canEdit: boolean;
  busy: boolean;
  onOpen: (m: Memory) => void;
  onEdit: (m: Memory) => void;
  onDelete: (m: Memory) => void;
  onToggleFavorite: (m: Memory) => void;
}
export function MemoryCard({
  memory: m,
  canEdit,
  busy,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
}: Props) {
  const photos = m.photos.filter(
    (p) => !p.storage_delete_pending && !p.upload_pending,
  );
  const cover = photos[0];
  return (
    <article
      data-calendar-record={m.id}
      className="group min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {cover && !m.storage_delete_pending ? (
          <MemoryPhotoView
            url={cover.url}
            alt={m.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-50 to-amber-50 text-primary-700 dark:from-primary-950 dark:to-neutral-900 dark:text-primary-200">
            <ImageIcon size={32} strokeWidth={1.3} />
            <span className="text-xs">
              {m.storage_delete_pending
                ? "Menunggu penghapusan"
                : "Cerita yang berharga"}
            </span>
          </div>
        )}
        <button
          onClick={() => onOpen(m)}
          disabled={m.storage_delete_pending || busy}
          aria-label={`Baca kenangan ${m.title}`}
          className="absolute inset-0 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary-500"
        />
        {!!photos.length && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white">
            {photos.length} foto
          </span>
        )}
        {canEdit && !m.storage_delete_pending && (
          <button
            disabled={busy}
            onClick={() => onToggleFavorite(m)}
            aria-label={
              m.is_favorite
                ? `Hapus ${m.title} dari favorit`
                : `Favoritkan ${m.title}`
            }
            aria-pressed={m.is_favorite}
            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-card/95 shadow-sm"
          >
            <Heart
              size={18}
              className={
                m.is_favorite
                  ? "fill-rose-500 text-rose-500"
                  : "text-muted-foreground"
              }
            />
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="text-[11px] font-medium text-muted-foreground">
          <CalendarDateLink date={m.date} source="memory">
            {new Intl.DateTimeFormat("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            }).format(new Date(m.date))}
          </CalendarDateLink>
        </p>
        <button
          disabled={busy || m.storage_delete_pending}
          onClick={() => onOpen(m)}
          className="mt-1 text-left"
        >
          <h2 className="break-words text-base font-semibold leading-snug">
            {m.title}
          </h2>
        </button>
        <p className="mt-2 line-clamp-2 min-h-8 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
          {m.storage_delete_pending
            ? "Akses kenangan ditutup. Coba hapus lagi untuk menyelesaikan penghapusan file."
            : m.content || "Satu momen, banyak cerita."}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
          <span className="text-[11px] text-muted-foreground">
            {m.is_favorite ? "♥ Momen favorit" : "Tersimpan bersama"}
          </span>
          {canEdit && (
            <div className="flex">
              {!m.storage_delete_pending && (
                <button
                  disabled={busy}
                  onClick={() => onEdit(m)}
                  aria-label={`Edit ${m.title}`}
                  className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"
                >
                  <Pencil size={15} />
                </button>
              )}
              <button
                disabled={busy}
                onClick={() => onDelete(m)}
                aria-label={
                  m.storage_delete_pending
                    ? `Coba hapus ${m.title} lagi`
                    : `Hapus ${m.title}`
                }
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-xs text-red-700 hover:bg-muted dark:text-red-300"
              >
                {m.storage_delete_pending ? (
                  "Coba hapus lagi"
                ) : (
                  <Trash2 size={15} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
