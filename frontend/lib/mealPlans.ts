import { z } from "zod";

export function isRecipeURL(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

export const mealFormSchema = z.object({
  name: z.string().trim().min(1, "Nama masakan wajib diisi").max(150, "Nama maksimal 150 karakter"),
  notes: z.string().trim().max(2000, "Catatan maksimal 2000 karakter"),
  recipe_url: z.string().trim().max(2048, "Link resep terlalu panjang").refine((value) => {
    return !value || isRecipeURL(value);
  }, "Gunakan link resep http atau https yang valid"),
  date: z.string().refine((value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Tanggal tidak valid"),
  meal_type: z.enum(["breakfast", "lunch", "dinner"]),
});
export type MealFormValues = z.infer<typeof mealFormSchema>;
