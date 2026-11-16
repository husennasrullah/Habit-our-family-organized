import { z } from "zod";
export function localMemoryDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export const memorySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi")
    .max(160, "Maksimal 160 karakter"),
  content: z.string().max(20000, "Cerita maksimal 20.000 karakter").optional(),
  date: z
    .string()
    .refine(
      (s) =>
        /^\d{4}-\d{2}-\d{2}$/.test(s) &&
        s >= "0001-01-01" &&
        !isNaN(Date.parse(s)) &&
        new Date(s).toISOString().slice(0, 10) === s,
      "Tanggal tidak valid",
    ),
});
export function validateMemoryFiles(
  files: Pick<File, "name" | "size">[],
  existing = 0,
): string {
  if (files.length + existing > 20) return "Maksimal 20 foto per kenangan.";
  if (files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024)
    return "Total unggahan maksimal 40 MB. Tambahkan foto secara bertahap.";
  if (
    files.some(
      (f) =>
        !/\.(jpe?g|png|webp)$/i.test(f.name) ||
        f.size <= 0 ||
        f.size > 8 * 1024 * 1024,
    )
  )
    return "Gunakan JPG, PNG, atau WebP, maksimal 8 MB per foto.";
  return "";
}
