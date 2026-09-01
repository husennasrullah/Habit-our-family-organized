"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Trash2, Loader2, ImagePlus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUploadPhotos, useDeletePhoto } from "@/hooks/useMemories";
import { toast } from "sonner";
import type { Memory } from "@/types";

const memorySchema = z.object({
  title:   z.string().min(1, "Judul wajib diisi"),
  content: z.string().optional(),
  date:    z.string().min(1, "Tanggal wajib diisi"),
});

export type MemoryFormValues = z.infer<typeof memorySchema>;

interface MemoryModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  onSave:      (values: MemoryFormValues, pendingFiles: File[]) => void;
  onDelete?:   () => void;
  memory?:     Memory | null;
  isSaving?:   boolean;
  isDeleting?: boolean;
}

export function MemoryModal({
  isOpen, onClose, onSave, onDelete, memory, isSaving, isDeleting,
}: MemoryModalProps) {
  const isEditing = !!memory;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const uploadPhotos = useUploadPhotos();
  const deletePhoto  = useDeletePhoto();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MemoryFormValues>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      title: "", content: "",
      date: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (memory) {
      reset({ title: memory.title, content: memory.content ?? "", date: memory.date.slice(0, 10) });
    } else {
      reset({ title: "", content: "", date: new Date().toISOString().slice(0, 10) });
    }
    setPendingFiles([]);
    setPreviews([]);
  }, [memory, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPendingFiles((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  };

  const removePending = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setPendingFiles((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const onSubmit = async (values: MemoryFormValues) => {
    await onSave(values, pendingFiles);
  };

  const handleUploadPending = async (memoryId: string) => {
    if (!pendingFiles.length) return;
    try {
      await uploadPhotos.mutateAsync({ memoryId, files: pendingFiles });
      setPendingFiles([]);
      previews.forEach((u) => URL.revokeObjectURL(u));
      setPreviews([]);
    } catch {
      toast.error("Gagal upload foto");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEditing ? "Edit Kenangan" : "Tambah Kenangan"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="memory-form" onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="mem-title">Judul *</Label>
            <Input id="mem-title" placeholder="Nama kenangan" {...register("title")}
              className={cn(errors.title && "border-error-500")} />
            {errors.title && <p className="text-xs text-error-500">{errors.title.message}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label htmlFor="mem-date">Tanggal *</Label>
            <Input id="mem-date" type="date" {...register("date")} className={cn(errors.date && "border-error-500")} />
          </div>

          {/* Content */}
          <div className="space-y-1">
            <Label htmlFor="mem-content">Cerita</Label>
            <textarea
              id="mem-content"
              rows={3}
              placeholder="Tulis cerita kenangan ini..."
              {...register("content")}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm placeholder-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 resize-none"
            />
          </div>

          {/* Existing photos (edit mode) */}
          {isEditing && memory && memory.photos.length > 0 && (
            <div className="space-y-1.5">
              <Label>Foto yang ada</Label>
              <div className="flex flex-wrap gap-2">
                {memory.photos.map((photo) => (
                  <div key={photo.id} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => deletePhoto.mutate({ memoryId: memory.id, photoId: photo.id })}
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo upload */}
          <div className="space-y-1.5">
            <Label>Tambah Foto</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap gap-2">
              {previews.map((url, idx) => (
                <div key={idx} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removePending(idx)}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-primary-400 hover:text-primary-400 transition-colors"
              >
                <ImagePlus className="h-6 w-6" />
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4">
          {isEditing && onDelete ? (
            <button type="button" onClick={onDelete} disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors disabled:opacity-50">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Hapus
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button
              type="submit"
              form="memory-form"
              disabled={isSaving || uploadPhotos.isPending}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {(isSaving || uploadPhotos.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {isEditing ? "Simpan" : "Buat Kenangan"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
