import { z } from "zod";
export function eventLocalValue(iso: string, allDay = false) {
  if (allDay) {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? ""
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(d);
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
export function eventDateToISO(local: string, allDay: boolean, end = false) {
  const value = allDay
    ? `${local.slice(0, 10)}T${end ? "23:59:59" : "00:00:00"}`
    : local;
  const d = new Date(value + "+07:00");
  return isNaN(d.getTime()) ? "" : d.toISOString();
}
export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Judul wajib diisi")
      .max(160, "Maksimal 160 karakter"),
    description: z.string().max(20000, "Maksimal 20.000 karakter").optional(),
    start_at: z.string().min(1, "Waktu mulai wajib diisi"),
    end_at: z.string().min(1, "Waktu selesai wajib diisi"),
    is_all_day: z.boolean(),
    type: z.enum(["general", "school", "medical", "birthday", "vacation"]),
    color: z.string(),
    is_recurring: z.boolean(),
    reminder_minutes: z.coerce.number().int().min(0).max(10080),
  })
  .superRefine((v, ctx) => {
    const valid = (s: string) => {
      const pattern = v.is_all_day
        ? /^\d{4}-\d{2}-\d{2}$/
        : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
      if (!pattern.test(s) || s.startsWith("0000")) return false;
      const iso = eventDateToISO(s, v.is_all_day);
      return (
        !!iso &&
        (v.is_all_day
          ? new Intl.DateTimeFormat("en-CA", {
              timeZone: "Asia/Jakarta",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(iso)) === s
          : eventLocalValue(iso) === s)
      );
    };
    for (const key of ["start_at", "end_at"] as const)
      if (!valid(v[key]))
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Tanggal atau waktu tidak valid",
        });
    const start = eventDateToISO(v.start_at, v.is_all_day),
      end = eventDateToISO(v.end_at, v.is_all_day, true);
    if (start && end && end <= start)
      ctx.addIssue({
        code: "custom",
        path: ["end_at"],
        message: "Waktu selesai harus setelah mulai",
      });
  });
