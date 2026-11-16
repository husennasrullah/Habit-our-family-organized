/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { ModalFrame } from "@/components/shared/ModalFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemoryPhotoView } from "./MemoryPhotoView";
import {
  localMemoryDate,
  memorySchema,
  validateMemoryFiles,
} from "@/lib/memories";
import type { Memory, MemoryPhoto } from "@/types";
export type MemoryFormValues = z.infer<typeof memorySchema>;
interface Props {
  memory?: Memory | null;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (v: MemoryFormValues, files: File[]) => Promise<void>;
  onDeletePhoto: (photo: MemoryPhoto) => Promise<void>;
}
export function MemoryModal({
  memory,
  busy,
  error,
  onClose,
  onSave,
  onDeletePhoto,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemoryFormValues>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      title: memory?.title ?? "",
      content: memory?.content ?? "",
      date: memory?.date.slice(0, 10) ?? localMemoryDate(),
    },
  });
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  const addFiles = (incoming: File[]) => {
    const next = [...files, ...incoming];
    const issue = validateMemoryFiles(next, memory?.photos.length ?? 0);
    setFileError(issue);
    if (!issue) setFiles(next);
  };
  return (
    <ModalFrame
      onClose={() => {
        if (!busy) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
    >
      <section className="w-full max-w-[360px] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <header className="flex items-center justify-between border-b border-border p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-300">
              Album keluarga
            </p>
            <h2 className="mt-1 text-base font-semibold">
              {memory ? "Edit kenangan" : "Simpan momen baru"}
            </h2>
          </div>
          <button
            disabled={busy}
            onClick={onClose}
            aria-label="Tutup form"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted"
          >
            <X size={18} />
          </button>
        </header>
        <form
          id="memory-form"
          onSubmit={handleSubmit(async (v) => {
            setFileError("");
            await onSave(v, files);
          })}
          className="max-h-[65dvh] space-y-4 overflow-y-auto p-4"
        >
          <fieldset disabled={busy} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-foreground" htmlFor="mem-title">
                Judul momen
              </Label>
              <Input
                className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                id="mem-title"
                maxLength={160}
                placeholder="Misalnya, piknik hari Minggu"
                {...register("title")}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p
                  id="title-error"
                  className="text-xs text-red-700 dark:text-red-300"
                >
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-foreground" htmlFor="mem-date">
                Tanggal
              </Label>
              <Input
                className="border-border bg-background text-foreground dark:[color-scheme:dark]"
                id="mem-date"
                type="date"
                {...register("date")}
                aria-invalid={!!errors.date}
              />
              {errors.date && (
                <p className="text-xs text-red-700 dark:text-red-300">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-foreground" htmlFor="mem-content">
                Cerita di balik momen
              </Label>
              <textarea
                id="mem-content"
                rows={4}
                maxLength={20000}
                {...register("content")}
                placeholder="Hal kecil apa yang ingin selalu diingat?"
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              {errors.content && (
                <p className="text-xs text-red-700">{errors.content.message}</p>
              )}
            </div>
            {!!memory?.photos.length && (
              <div>
                <Label className="text-foreground">
                  Foto tersimpan · {memory.photos.length}
                </Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {memory.photos.map((p, i) => (
                    <div
                      key={p.id}
                      className="relative overflow-hidden rounded-lg border border-border"
                    >
                      {p.storage_delete_pending || p.upload_pending ? (
                        <div className="flex aspect-square items-center p-2 text-center text-xs text-muted-foreground">
                          Menunggu dihapus
                        </div>
                      ) : (
                        <MemoryPhotoView
                          url={p.url}
                          alt={`Foto ${i + 1}`}
                          className="aspect-square w-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onDeletePhoto(p)}
                        aria-label={
                          p.storage_delete_pending
                            ? `Coba hapus foto ${i + 1} lagi`
                            : `Hapus foto ${i + 1}`
                        }
                        className="flex min-h-11 w-full items-center justify-center gap-1 bg-muted text-xs text-red-700 dark:text-red-300"
                      >
                        <Trash2 size={13} />
                        {p.storage_delete_pending || p.upload_pending
                          ? "Coba lagi"
                          : "Hapus"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-foreground">Tambah foto</Label>
              <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => input.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!busy) addFiles(Array.from(e.dataTransfer.files));
                }}
                className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary-300 bg-primary-50/50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-200"
              >
                <ImagePlus size={23} />
                <span className="text-xs font-medium">
                  Pilih atau tarik foto ke sini
                </span>
              </button>
              <p className="text-[11px] text-muted-foreground">
                JPG, PNG, WebP · 8 MB/foto · maks. 20 foto
              </p>
              {!!previews.length && (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((url, i) => (
                    <div className="relative" key={url}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Foto baru ${i + 1}`}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((f) => f.filter((_, j) => i !== j))
                        }
                        aria-label={`Batalkan foto baru ${i + 1}`}
                        className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </fieldset>
          {(error || fileError) && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950 dark:text-red-200"
            >
              {fileError || error}
            </p>
          )}
        </form>
        <footer className="flex justify-end gap-2 border-t border-border p-4">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Batal
          </Button>
          <Button form="memory-form" type="submit" disabled={busy}>
            {busy && <Loader2 size={15} className="mr-2 animate-spin" />}
            {busy ? "Menyimpan…" : "Simpan kenangan"}
          </Button>
        </footer>
      </section>
    </ModalFrame>
  );
}
