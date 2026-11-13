"use client";

import { useState, type FormEvent } from "react";
import { ZodError } from "zod";
import { AxiosError } from "axios";
import { X } from "lucide-react";
import { ModalFrame } from "@/components/shared/ModalFrame";
import {
  dateKey,
  kidsToday,
  profileSchema,
  resourcePayload,
  type KidResource,
} from "@/lib/kids";
import type {
  KidProfile,
  GrowthRecord,
  VaccineRecord,
  Milestone,
  HealthRecord,
} from "@/types";

export type KidRecord = GrowthRecord | VaccineRecord | Milestone | HealthRecord;
export type KidFormTarget =
  | { type: "profile"; kid?: KidProfile }
  | { type: KidResource; kid: KidProfile; record?: KidRecord; given?: boolean };
type Field = {
  key: string;
  label: string;
  kind?: "date" | "number" | "textarea" | "select";
  required?: boolean;
  max?: number;
  options?: [string, string][];
  future?: boolean;
};
const notes: Field = {
  key: "notes",
  label: "Catatan",
  kind: "textarea",
  max: 2000,
};
const genderOptions: [string, string][] = [
  ["", "Belum diatur"],
  ["male", "Laki-laki"],
  ["female", "Perempuan"],
];
const configs: Record<
  "profile" | KidResource,
  { title: string; fields: Field[] }
> = {
  profile: {
    title: "profil anak",
    fields: [
      { key: "name", label: "Nama anak", required: true, max: 150 },
      {
        key: "birth_date",
        label: "Tanggal lahir",
        kind: "date",
        required: true,
      },
      {
        key: "gender",
        label: "Jenis kelamin",
        kind: "select",
        options: genderOptions,
      },
      notes,
    ],
  },
  growth: {
    title: "catatan pertumbuhan",
    fields: [
      {
        key: "date",
        label: "Tanggal pengukuran",
        kind: "date",
        required: true,
      },
      { key: "height_cm", label: "Panjang / tinggi (cm)", kind: "number" },
      { key: "weight_kg", label: "Berat (kg)", kind: "number" },
      {
        key: "head_circumference_cm",
        label: "Lingkar kepala (cm)",
        kind: "number",
      },
      notes,
    ],
  },
  vaccines: {
    title: "jadwal vaksin",
    fields: [
      { key: "vaccine_name", label: "Nama vaksin", required: true, max: 150 },
      {
        key: "scheduled_date",
        label: "Tanggal jadwal",
        kind: "date",
        required: true,
        future: true,
      },
      {
        key: "given_date",
        label: "Tanggal diberikan (kosong jika belum)",
        kind: "date",
      },
      { key: "given_by", label: "Pemberi vaksin / fasilitas", max: 150 },
      notes,
    ],
  },
  milestones: {
    title: "milestone",
    fields: [
      { key: "title", label: "Pencapaian", required: true, max: 150 },
      {
        key: "category",
        label: "Kategori",
        kind: "select",
        options: [
          ["", "Belum diatur"],
          ["motorik", "Motorik"],
          ["bahasa", "Bahasa"],
          ["sosial", "Sosial"],
          ["kognitif", "Kognitif"],
          ["other", "Lainnya"],
        ],
      },
      {
        key: "achieved_at",
        label: "Tanggal tercapai (kosong jika belum)",
        kind: "date",
      },
      notes,
    ],
  },
  health: {
    title: "catatan kesehatan",
    fields: [
      { key: "date", label: "Tanggal", kind: "date", required: true },
      {
        key: "type",
        label: "Jenis catatan",
        kind: "select",
        options: [
          ["illness", "Sakit"],
          ["checkup", "Kontrol"],
          ["dental", "Gigi"],
          ["other", "Lainnya"],
        ],
      },
      {
        key: "description",
        label: "Keluhan / deskripsi",
        kind: "textarea",
        required: true,
        max: 2000,
      },
      { key: "doctor", label: "Nama dokter", max: 150 },
      { key: "medication", label: "Obat", kind: "textarea", max: 1000 },
      notes,
    ],
  },
};
export function KidForm({
  target,
  saving,
  onClose,
  onSave,
}: {
  target: KidFormTarget;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, string | number | null>) => Promise<void>;
}) {
  const config = configs[target.type];
  const editing = target.type === "profile" ? !!target.kid : !!target.record;
  const title =
    target.type !== "profile" && target.given
      ? "Catat vaksin diberikan"
      : `${editing ? "Edit" : "Tambah"} ${config.title}`;
  const [values, setValues] = useState<Record<string, string>>(() => {
    const item = target.type === "profile" ? target.kid : target.record;
    const map: Record<string, string> = {};
    for (const f of config.fields) {
      const raw = item
        ? (item as unknown as Record<string, unknown>)[f.key]
        : undefined;
      map[f.key] =
        raw === undefined || raw === null
          ? f.key === "type"
            ? "illness"
            : f.key === "date" || f.key === "scheduled_date"
              ? kidsToday()
              : ""
          : f.kind === "date"
            ? dateKey(String(raw))
            : String(raw);
    }
    if (target.type === "vaccines" && target.given && !map.given_date)
      map.given_date = kidsToday();
    return map;
  });
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    try {
      const payload =
        target.type === "profile"
          ? profileSchema.parse(values)
          : resourcePayload(target.type, values, target.kid.birth_date);
      if (target.type === "vaccines" && target.given && !values.given_date)
        throw new Error("Tanggal vaksin diberikan wajib diisi");
      setError("");
      await onSave(payload);
    } catch (err) {
      setError(
        err instanceof ZodError
          ? err.issues[0].message
          : err instanceof AxiosError
            ? (err.response?.data?.message ?? "Gagal menyimpan. Coba lagi.")
            : err instanceof Error
              ? err.message
              : "Gagal menyimpan",
      );
    }
  };
  return (
    <ModalFrame
      className="kids-dialog fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClose={() => {
        if (!saving) onClose();
      }}
    >
      <div className="kids-dialog-card">
        <div className="kids-dialog-header">
          <div>
            <h2>{title}</h2>
            <p>
              {target.type === "profile"
                ? "Informasi dasar dan catatan anak."
                : target.kid.name}
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup form anak"
            onClick={onClose}
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="kids-form">
          <fieldset disabled={saving} className="contents">
            {config.fields.map((f) => (
              <div key={f.key} className="kids-field">
                <label htmlFor={`kid-${f.key}`}>
                  {f.label}
                  {f.required ? " *" : ""}
                </label>
                {f.kind === "select" ? (
                  <select
                    id={`kid-${f.key}`}
                    value={values[f.key]}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                  >
                    {f.options?.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : f.kind === "textarea" ? (
                  <textarea
                    id={`kid-${f.key}`}
                    rows={f.key === "notes" ? 2 : 3}
                    required={f.required}
                    maxLength={f.max}
                    value={values[f.key]}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    id={`kid-${f.key}`}
                    type={f.kind ?? "text"}
                    required={f.required}
                    maxLength={f.max}
                    min={
                      f.kind === "date" && target.type !== "profile"
                        ? dateKey(target.kid.birth_date)
                        : f.kind === "number"
                          ? "0.01"
                          : undefined
                    }
                    max={
                      f.kind === "date" && !f.future
                        ? kidsToday()
                        : f.kind === "number"
                          ? "999.99"
                          : undefined
                    }
                    step={f.kind === "number" ? "0.01" : undefined}
                    value={values[f.key]}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
          </fieldset>
          {target.type === "growth" && (
            <p className="kids-help">
              Isi minimal satu ukuran. Catat panjang telentang sebelum usia 2
              tahun atau tinggi berdiri mulai 2 tahun.
            </p>
          )}
          {error && (
            <p role="alert" className="kids-form-error">
              {error}
            </p>
          )}
          <div className="kids-dialog-actions">
            <button
              type="button"
              className="kids-button"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>
            <button
              className="kids-button is-primary"
              type="submit"
              disabled={saving}
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </ModalFrame>
  );
}
