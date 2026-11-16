import { z } from "zod";
import { differenceInMonths, format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { GrowthRecord } from "@/types";

export type KidResource = "growth" | "vaccines" | "milestones" | "health";
export function kidsToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}
export function dateKey(value?: string | null) {
  return value?.slice(0, 10) ?? "";
}
export function kidsDate(value?: string | null) {
  const key = dateKey(value);
  if (!key) return "—";
  const day = parseISO(key);
  return Number.isNaN(day.getTime())
    ? "Tanggal tidak valid"
    : format(day, "d MMM yyyy", { locale: id });
}
export function kidAge(value: string) {
  const birth = parseISO(dateKey(value));
  if (Number.isNaN(birth.getTime()) || dateKey(value) > kidsToday())
    return "Usia belum tersedia";
  const months = differenceInMonths(parseISO(kidsToday()), birth);
  return months < 12
    ? `${months} bulan`
    : `${Math.floor(months / 12)} tahun${months % 12 ? ` ${months % 12} bulan` : ""}`;
}
export const canManageKids = (role?: string) =>
  role === "admin" || role === "member";
const text = (max: number) =>
  z.string().trim().max(max, `Maksimal ${max} karakter`);
const required = (max: number) => text(max).min(1, "Wajib diisi");
export function validKidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000"))
    return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
const calendarDate = z.string().refine(validKidDate, "Tanggal tidak valid");
const actualDate = calendarDate.refine(
  (v) => v <= kidsToday(),
  "Tanggal aktual tidak boleh di masa depan",
);
const optionalActualDate = z
  .string()
  .refine(
    (v) => !v || (validKidDate(v) && v <= kidsToday()),
    "Tanggal aktual tidak valid atau di masa depan",
  );
const measurement = z
  .string()
  .trim()
  .refine(
    (value) =>
      !value ||
      (Number.isFinite(Number(value)) &&
        Number(value) > 0 &&
        Number(value) <= 999.99 &&
        Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 1e-7),
    "Ukuran harus positif, maksimal 999,99 dan dua desimal",
  );
export const profileSchema = z.object({
  name: required(150),
  gender: z.enum(["", "male", "female"]),
  birth_date: actualDate,
  notes: text(2000),
});
export const growthSchema = z
  .object({
    date: actualDate,
    height_cm: measurement,
    weight_kg: measurement,
    head_circumference_cm: measurement,
    notes: text(2000),
  })
  .refine((v) => !!(v.height_cm || v.weight_kg || v.head_circumference_cm), {
    message: "Isi minimal satu ukuran pertumbuhan",
    path: ["height_cm"],
  });
export const vaccineSchema = z.object({
  vaccine_name: required(150),
  scheduled_date: calendarDate,
  given_date: optionalActualDate,
  given_by: text(150),
  notes: text(2000),
});
export const milestoneSchema = z.object({
  title: required(150),
  category: z.enum(["", "motorik", "bahasa", "sosial", "kognitif", "other"]),
  achieved_at: optionalActualDate,
  notes: text(2000),
});
export const healthSchema = z.object({
  type: z.enum(["illness", "checkup", "dental", "other"]),
  description: required(2000),
  date: actualDate,
  doctor: text(150),
  medication: text(1000),
  notes: text(2000),
});
export const resourceSchemas = {
  growth: growthSchema,
  vaccines: vaccineSchema,
  milestones: milestoneSchema,
  health: healthSchema,
};
export function resourcePayload(
  resource: KidResource,
  values: Record<string, string>,
  birth: string,
) {
  const parsed = resourceSchemas[resource].parse(values);
  for (const key of [
    "date",
    "scheduled_date",
    "given_date",
    "achieved_at",
  ] as const) {
    const value = (parsed as Record<string, string>)[key];
    if (value && value < dateKey(birth))
      throw new Error("Tanggal tidak boleh sebelum tanggal lahir anak");
  }
  const payload: Record<string, string | number | null> = { ...parsed };
  if (resource === "growth")
    for (const key of ["height_cm", "weight_kg", "head_circumference_cm"])
      payload[key] = values[key].trim() ? Number(values[key]) : null;
  if (resource === "vaccines") payload.given_date = values.given_date || null;
  if (resource === "milestones")
    payload.achieved_at = values.achieved_at || null;
  return payload;
}
// Missing measurements stay as null so one incomplete row never removes a whole series.
export function growthSeries(
  records: GrowthRecord[],
  field: "height_cm" | "weight_kg" | "head_circumference_cm",
) {
  return [...records]
    .sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)))
    .map((r) => ({
      date: dateKey(r.date),
      value:
        typeof r[field] === "number" &&
        Number.isFinite(r[field]) &&
        r[field]! > 0
          ? r[field]
          : null,
      id: r.id,
    }));
}
