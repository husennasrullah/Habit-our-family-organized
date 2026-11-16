"use client";
import { ImageIcon, RotateCcw } from "lucide-react";
import { usePhotoResource } from "@/hooks/usePhotoUrl";
export function MemoryPhotoView({
  url,
  alt,
  className = "",
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  const photo = usePhotoResource(url);
  if (photo.error)
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground ${className}`}
      >
        <ImageIcon size={24} />
        <button
          type="button"
          onClick={photo.retry}
          className="relative z-20 inline-flex min-h-11 items-center gap-1 px-2 text-xs"
        >
          <RotateCcw size={14} />
          Coba muat foto lagi
        </button>
      </div>
    );
  if (!photo.url)
    return (
      <div
        role="status"
        aria-label="Memuat foto"
        className={`animate-pulse bg-muted ${className}`}
      />
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photo.url} alt={alt} className={className} />;
}
