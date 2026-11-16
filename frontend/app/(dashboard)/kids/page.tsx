"use client";

import { useRef, useState, useEffect } from "react";
import { useCalendarContext } from "@/hooks/useCalendarContext";
import { CalendarDateLink } from "@/components/shared/CalendarDateLink";
import { AxiosError } from "axios";
import {
  Baby,
  Plus,
  Pencil,
  Trash2,
  Check,
  TrendingUp,
  Syringe,
  Star,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryError } from "@/components/shared/QueryError";
import { ModalFrame } from "@/components/shared/ModalFrame";
import { Skeleton } from "@/components/ui/skeleton";
import {
  KidForm,
  type KidFormTarget,
  type KidRecord,
} from "@/components/kids/KidForm";
import { GrowthChart } from "@/components/kids/GrowthChart";
import {
  useKids,
  useGrowth,
  useVaccines,
  useMilestones,
  useHealthRecords,
  useSaveKid,
  useDeleteKid,
  useSaveKidRecord,
  useDeleteKidRecord,
  useSetMilestoneAchievement,
} from "@/hooks/useKids";
import {
  canManageKids,
  dateKey,
  kidsDate,
  kidAge,
  kidsToday,
  type KidResource,
} from "@/lib/kids";
import type { KidProfile } from "@/types";

const tabs = [
  { value: "growth", label: "Pertumbuhan", icon: TrendingUp },
  { value: "vaccines", label: "Vaksin", icon: Syringe },
  { value: "milestones", label: "Milestone", icon: Star },
  { value: "health", label: "Kesehatan", icon: Heart },
] as const;
const categoryLabels: Record<string, string> = {
  motorik: "Motorik",
  bahasa: "Bahasa",
  sosial: "Sosial",
  kognitif: "Kognitif",
  other: "Lainnya",
  illness: "Sakit",
  checkup: "Kontrol",
  dental: "Gigi",
};
type DeleteTarget = {
  kid: KidProfile;
  resource?: KidResource;
  record?: KidRecord;
  label: string;
};
const errorMessage = (error: unknown) =>
  error instanceof AxiosError
    ? (error.response?.data?.message ?? "Gagal menyimpan perubahan. Coba lagi.")
    : error instanceof Error
      ? error.message
      : "Gagal menyimpan perubahan";

export default function KidsPage() {
  const context = useCalendarContext();
  const role = useAuthStore((s) => s.user?.role);
  const allowed = canManageKids(role);
  const query = useKids();
  const kids = query.data ?? [];
  const [selectedId, setSelectedId] = useState("");
  const kid = kids.find((k) => k.id === selectedId) ?? kids[0];
  const kidId = kid?.id ?? "";
  const [active, setActive] = useState<KidResource>("growth");
  useEffect(() => {
    if (context.kid) setSelectedId(context.kid);
    if (
      context.tab &&
      ["growth", "vaccines", "milestones", "health"].includes(context.tab)
    )
      setActive(context.tab as KidResource);
  }, [context.kid, context.tab]);
  const [form, setForm] = useState<KidFormTarget | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const growth = useGrowth(kidId),
    vaccines = useVaccines(kidId),
    milestones = useMilestones(kidId),
    health = useHealthRecords(kidId);
  const queries = { growth, vaccines, milestones, health };
  const current = queries[active];
  const saveKid = useSaveKid(),
    deleteKid = useDeleteKid(),
    saveRecord = useSaveKidRecord(),
    deleteRecord = useDeleteKidRecord(),
    achievement = useSetMilestoneAchievement();
  const operation = useRef(false);
  const busy =
    saveKid.isPending ||
    deleteKid.isPending ||
    saveRecord.isPending ||
    deleteRecord.isPending ||
    achievement.isPending;
  const save = async (payload: Record<string, string | number | null>) => {
    if (!form || operation.current) return;
    operation.current = true;
    try {
      if (form.type === "profile") {
        const saved = await saveKid.mutateAsync({
          id: form.kid?.id,
          payload: payload as {
            name: string;
            gender: string;
            birth_date: string;
            notes: string;
          },
        });
        setSelectedId(saved.id);
      } else
        await saveRecord.mutateAsync({
          kidId: form.kid.id,
          resource: form.type,
          id: form.record?.id,
          payload,
        });
      setForm(null);
      toast.success("Catatan anak tersimpan");
    } finally {
      operation.current = false;
    }
  };
  const confirmDelete = async () => {
    if (!deleting || operation.current) return;
    operation.current = true;
    setDeleteError("");
    try {
      if (deleting.resource && deleting.record)
        await deleteRecord.mutateAsync({
          kidId: deleting.kid.id,
          resource: deleting.resource,
          id: deleting.record.id,
        });
      else {
        await deleteKid.mutateAsync(deleting.kid.id);
        if (selectedId === deleting.kid.id) setSelectedId("");
      }
      setDeleting(null);
      toast.success("Data anak dihapus");
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      operation.current = false;
    }
  };
  const unachieve = async (id: string) => {
    if (operation.current) return;
    operation.current = true;
    try {
      await achievement.mutateAsync({ kidId, id, achieved: false });
      toast.success("Pencapaian dibuka kembali");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      operation.current = false;
    }
  };
  const actions = (resource: KidResource, record: KidRecord, label: string) => (
    <div className="kids-row-actions">
      <button
        type="button"
        className="kids-icon-button"
        aria-label={`Edit ${label}`}
        onClick={() => setForm({ type: resource, kid: kid!, record })}
        disabled={busy}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        className="kids-icon-button is-danger"
        aria-label={`Hapus ${label}`}
        onClick={() => {
          setDeleteError("");
          setDeleting({ kid: kid!, resource, record, label });
        }}
        disabled={busy}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
  if (!allowed)
    return (
      <div className="kids-page">
        <PageHeader
          title="Anak"
          description="Catatan tumbuh kembang keluarga."
        />
        <div className="kids-empty">
          Menu Anak hanya tersedia untuk anggota dewasa keluarga.
        </div>
      </div>
    );
  if (query.isPending)
    return (
      <div className="space-y-4">
        <PageHeader
          title="Anak"
          description="Temani setiap langkah tumbuh kembang si kecil."
        />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  if (query.isError) return <QueryError retry={() => void query.refetch()} />;
  return (
    <div className="kids-page">
      <PageHeader
        title="Anak"
        description="Temani setiap langkah tumbuh kembang si kecil."
        action={
          <button
            className="kids-button is-primary"
            onClick={() => setForm({ type: "profile" })}
            disabled={busy}
          >
            <Plus size={16} />
            Tambah Anak
          </button>
        }
      />
      {!kids.length ? (
        <div className="kids-empty kids-empty-profiles">
          <Baby size={36} />
          <h2>Belum ada profil anak</h2>
          <p>
            Tambahkan profil untuk mencatat pertumbuhan, vaksin, dan
            kesehatannya.
          </p>
          <button
            className="kids-button is-primary"
            onClick={() => setForm({ type: "profile" })}
          >
            <Plus size={16} />
            Tambah Profil Anak
          </button>
        </div>
      ) : (
        kid && (
          <div className="kids-workspace">
            <aside className="kids-list" aria-label="Daftar anak">
              <p className="kids-list-label">Daftar anak</p>
              {kids.map((item) => (
                <button
                  key={item.id}
                  className={`kids-profile-option ${kidId === item.id ? "is-active" : ""}`}
                  aria-label={`Pilih ${item.name}`}
                  aria-pressed={kidId === item.id}
                  disabled={busy}
                  onClick={() => {
                    setSelectedId(item.id);
                    setActive("growth");
                    setForm(null);
                  }}
                >
                  <span
                    className={`kids-avatar ${item.gender === "female" ? "is-female" : ""}`}
                    aria-hidden="true"
                  >
                    {item.name.trim().charAt(0).toLocaleUpperCase() || "?"}
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{kidAge(item.birth_date)}</small>
                  </span>
                </button>
              ))}
              <button
                className="kids-button kids-add-profile"
                onClick={() => setForm({ type: "profile" })}
                disabled={busy}
              >
                <Plus size={15} />
                Tambah Profil
              </button>
            </aside>
            <div className="kids-detail" key={kidId}>
              <section className="kids-profile-header">
                <div>
                  <h2>{kid.name}</h2>
                  <p>
                    {kidAge(kid.birth_date)} · Lahir {kidsDate(kid.birth_date)}
                    {kid.gender
                      ? ` · ${kid.gender === "female" ? "Perempuan" : "Laki-laki"}`
                      : ""}
                  </p>
                  {kid.notes && (
                    <p className="kids-profile-notes">{kid.notes}</p>
                  )}
                </div>
                <div className="kids-row-actions">
                  <button
                    className="kids-button"
                    onClick={() => setForm({ type: "profile", kid })}
                    disabled={busy}
                  >
                    <Pencil size={14} />
                    Edit profil
                  </button>
                  <button
                    className="kids-icon-button is-danger"
                    aria-label={`Hapus profil ${kid.name}`}
                    disabled={busy}
                    onClick={() => {
                      setDeleteError("");
                      setDeleting({ kid, label: `profil ${kid.name}` });
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </section>
              <div className="kids-tabs" role="group" aria-label="Catatan anak">
                {tabs.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    aria-pressed={active === value}
                    className={active === value ? "is-active" : ""}
                    onClick={() => setActive(value)}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <section
                className="kids-record-panel"
                aria-label={tabs.find((t) => t.value === active)?.label}
              >
                <div className="kids-panel-header">
                  <h2>
                    {active === "growth"
                      ? "Catatan pertumbuhan"
                      : active === "vaccines"
                        ? "Jadwal & riwayat vaksin"
                        : active === "milestones"
                          ? "Pencapaian tumbuh kembang"
                          : "Riwayat kesehatan"}
                  </h2>
                  <button
                    className="kids-button"
                    disabled={busy}
                    onClick={() => setForm({ type: active, kid })}
                  >
                    <Plus size={15} />
                    {active === "vaccines"
                      ? "Tambah vaksin"
                      : active === "milestones"
                        ? "Tambah milestone"
                        : "Catat baru"}
                  </button>
                </div>
                {current.isError ? (
                  <QueryError retry={() => void current.refetch()} />
                ) : current.isPending ? (
                  <Skeleton className="m-4 h-40 rounded-xl" />
                ) : (
                  <>
                    {active === "growth" && (
                      <>
                        {!growth.data?.length ? (
                          <div className="kids-empty">
                            Belum ada catatan pertumbuhan. Catat ukuran pertama
                            si kecil.
                          </div>
                        ) : (
                          <>
                            <GrowthChart
                              key={kidId}
                              kid={kid}
                              records={growth.data}
                            />
                            <div
                              className="kids-growth-table"
                              role="table"
                              aria-label={`Riwayat pertumbuhan ${kid.name}`}
                            >
                              <div
                                className="kids-growth-row is-header"
                                role="row"
                              >
                                <span role="columnheader">Tanggal</span>
                                <span role="columnheader">
                                  Panjang / tinggi
                                </span>
                                <span role="columnheader">Berat</span>
                                <span role="columnheader">Lingkar kepala</span>
                                <span role="columnheader" className="sr-only">
                                  Aksi
                                </span>
                              </div>
                              {[...growth.data]
                                .sort((a, b) =>
                                  dateKey(b.date).localeCompare(
                                    dateKey(a.date),
                                  ),
                                )
                                .map((g) => (
                                  <div
                                    key={g.id}
                                    data-calendar-record={g.id}
                                    className="kids-growth-entry"
                                  >
                                    <div className="kids-growth-row" role="row">
                                      <span role="cell">
                                        <CalendarDateLink
                                          date={g.date}
                                          source="growth"
                                        >
                                          {kidsDate(g.date)}
                                        </CalendarDateLink>
                                      </span>
                                      <span role="cell">
                                        {g.height_cm ?? "—"}
                                        {g.height_cm !== null ? " cm" : ""}
                                      </span>
                                      <span role="cell">
                                        {g.weight_kg ?? "—"}
                                        {g.weight_kg !== null ? " kg" : ""}
                                      </span>
                                      <span role="cell">
                                        {g.head_circumference_cm ?? "—"}
                                        {g.head_circumference_cm !== null
                                          ? " cm"
                                          : ""}
                                      </span>
                                      <span role="cell">
                                        {actions(
                                          "growth",
                                          g,
                                          `pertumbuhan ${kidsDate(g.date)}`,
                                        )}
                                      </span>
                                    </div>
                                    {g.notes && (
                                      <p className="kids-record-notes">
                                        {g.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </>
                        )}
                      </>
                    )}
                    {active === "vaccines" && (
                      <>
                        <p className="kids-section-help">
                          Tambahkan jadwal sesuai catatan imunisasi anak.
                          Tanggal pemberian dapat berbeda dari jadwal.
                        </p>
                        {!vaccines.data?.length ? (
                          <div className="kids-empty">
                            Belum ada jadwal vaksin. Gunakan Tambah vaksin untuk
                            mulai mencatat.
                          </div>
                        ) : (
                          vaccines.data.map((v) => (
                            <article
                              key={v.id}
                              data-calendar-record={v.id}
                              className="kids-record-row"
                            >
                              <div className="kids-record-main">
                                <div className="kids-record-title">
                                  <h3>{v.vaccine_name}</h3>
                                  <span
                                    className={`kids-status is-${v.status}`}
                                  >
                                    {v.status === "given"
                                      ? "Sudah diberikan"
                                      : v.status === "overdue"
                                        ? "Terlambat"
                                        : "Terjadwal"}
                                  </span>
                                </div>
                                <p>
                                  Jadwal{" "}
                                  <CalendarDateLink
                                    date={v.scheduled_date}
                                    source="vaccine"
                                  >
                                    {kidsDate(v.scheduled_date)}
                                  </CalendarDateLink>
                                </p>
                                {v.given_date && (
                                  <p>
                                    Diberikan{" "}
                                    <CalendarDateLink
                                      date={v.given_date}
                                      source="vaccine"
                                    >
                                      {kidsDate(v.given_date)}
                                    </CalendarDateLink>
                                    {v.given_by ? ` · ${v.given_by}` : ""}
                                  </p>
                                )}
                                {v.notes && (
                                  <p className="kids-record-notes">{v.notes}</p>
                                )}
                              </div>
                              <div className="kids-record-controls">
                                {v.status !== "given" && (
                                  <button
                                    className="kids-button"
                                    disabled={busy}
                                    onClick={() =>
                                      setForm({
                                        type: "vaccines",
                                        kid,
                                        record: v,
                                        given: true,
                                      })
                                    }
                                  >
                                    Catat diberikan
                                  </button>
                                )}
                                {actions(
                                  "vaccines",
                                  v,
                                  `vaksin ${v.vaccine_name}`,
                                )}
                              </div>
                            </article>
                          ))
                        )}
                      </>
                    )}
                    {active === "milestones" && (
                      <>
                        {!milestones.data?.length ? (
                          <div className="kids-empty">
                            Belum ada milestone. Tambahkan pencapaian yang ingin
                            dicatat.
                          </div>
                        ) : (
                          milestones.data.map((m) => (
                            <article
                              key={m.id}
                              data-calendar-record={m.id}
                              className="kids-record-row"
                            >
                              <button
                                type="button"
                                className={`kids-milestone-check ${m.is_achieved ? "is-achieved" : ""}`}
                                aria-label={`${m.is_achieved ? "Buka kembali" : "Catat tercapai"} ${m.title}`}
                                aria-pressed={m.is_achieved}
                                disabled={busy}
                                onClick={() =>
                                  m.is_achieved
                                    ? void unachieve(m.id)
                                    : setForm({
                                        type: "milestones",
                                        kid,
                                        record: {
                                          ...m,
                                          achieved_at: kidsToday(),
                                        },
                                      })
                                }
                              >
                                <span>
                                  {m.is_achieved && <Check size={13} />}
                                </span>
                              </button>
                              <div className="kids-record-main">
                                <h3>{m.title}</h3>
                                <p>
                                  {categoryLabels[m.category] ?? "Umum"}
                                  {m.achieved_at
                                    ? ` · Tercapai ${kidsDate(m.achieved_at)}`
                                    : " · Belum tercapai"}
                                </p>
                                {m.notes && (
                                  <p className="kids-record-notes">{m.notes}</p>
                                )}
                              </div>
                              {actions("milestones", m, `milestone ${m.title}`)}
                            </article>
                          ))
                        )}
                      </>
                    )}
                    {active === "health" && (
                      <>
                        {!health.data?.length ? (
                          <div className="kids-empty">
                            Belum ada catatan kesehatan.
                          </div>
                        ) : (
                          health.data.map((h) => (
                            <article
                              key={h.id}
                              data-calendar-record={h.id}
                              className="kids-record-row"
                            >
                              <div className="kids-record-main">
                                <div className="kids-record-title">
                                  <h3>{h.description}</h3>
                                  <span className="kids-status">
                                    {categoryLabels[h.type] ?? "Lainnya"}
                                  </span>
                                </div>
                                <p>
                                  <CalendarDateLink
                                    date={h.date}
                                    source="health"
                                  >
                                    {kidsDate(h.date)}
                                  </CalendarDateLink>
                                  {h.doctor ? ` · dr. ${h.doctor}` : ""}
                                </p>
                                {h.medication && (
                                  <p>
                                    <strong>Obat:</strong> {h.medication}
                                  </p>
                                )}
                                {h.notes && (
                                  <p className="kids-record-notes">{h.notes}</p>
                                )}
                              </div>
                              {actions(
                                "health",
                                h,
                                `catatan kesehatan ${kidsDate(h.date)}`,
                              )}
                            </article>
                          ))
                        )}
                      </>
                    )}
                  </>
                )}
              </section>
            </div>
          </div>
        )
      )}
      {form && (
        <KidForm
          key={`${form.type}-${form.kid?.id ?? "new"}-${form.type !== "profile" ? (form.record?.id ?? "new") : "profile"}`}
          target={form}
          saving={busy}
          onClose={() => {
            if (!busy) setForm(null);
          }}
          onSave={save}
        />
      )}
      {deleting && (
        <ModalFrame
          className="kids-dialog fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <div className="kids-dialog-card">
            <div className="kids-dialog-header">
              <h2>Hapus {deleting.label}?</h2>
            </div>
            <div className="kids-delete-body">
              <p>
                {deleting.resource
                  ? "Catatan ini akan dihapus dari riwayat anak."
                  : "Profil beserta catatan pertumbuhan, vaksin, milestone, dan kesehatannya akan dihapus."}
              </p>
              {deleteError && (
                <p role="alert" className="kids-form-error">
                  {deleteError}
                </p>
              )}
              <div className="kids-dialog-actions">
                <button
                  className="kids-button"
                  disabled={busy}
                  onClick={() => setDeleting(null)}
                >
                  Batal
                </button>
                <button
                  className="kids-button is-danger-solid"
                  disabled={busy}
                  onClick={() => void confirmDelete()}
                >
                  {busy ? "Menghapus…" : "Hapus"}
                </button>
              </div>
            </div>
          </div>
        </ModalFrame>
      )}
    </div>
  );
}
