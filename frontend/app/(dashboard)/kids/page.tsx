"use client";

import { QueryError } from "@/components/shared/QueryError";
import { PageHeader } from "@/components/shared/PageHeader";
import { useState } from "react";
import { differenceInMonths, formatDistanceToNow, parseISO } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import {
  Plus,
  Baby,
  TrendingUp,
  Syringe,
  Star,
  Heart,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useKids,
  useGrowth,
  useVaccines,
  useMilestones,
  useHealthRecords,
  useCreateKid,
  useAddGrowth,
  useMarkVaccineGiven,
  useToggleMilestone,
  useAddHealth,
} from "@/hooks/useKids";
import type { KidProfile } from "@/types";

type KidTab = "growth" | "vaccines" | "milestones" | "health";

const TABS: { value: KidTab; label: string; icon: React.ElementType }[] = [
  { value: "growth", label: "Pertumbuhan", icon: TrendingUp },
  { value: "vaccines", label: "Vaksin", icon: Syringe },
  { value: "milestones", label: "Milestone", icon: Star },
  { value: "health", label: "Kesehatan", icon: Heart },
];

const VACCINE_STATUS_STYLE = {
  given: "bg-success-50 text-success-700",
  scheduled: "bg-info-50 text-info-700",
  overdue: "bg-error-50 text-error-600 font-semibold",
};

function ageLabel(birthDate: string) {
  const months = differenceInMonths(new Date(), parseISO(birthDate));
  if (months < 12) return `${months} bulan`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} thn ${rem} bln` : `${years} tahun`;
}

function relativeDate(dateStr: string) {
  try {
    const d = parseISO(dateStr);
    const today = new Date().toISOString().slice(0, 10);
    if (dateStr === today) return "Hari ini";
    return formatDistanceToNow(d, { addSuffix: true, locale: dateLocale });
  } catch {
    return dateStr;
  }
}

// ── Mini SVG line chart ───────────────────────────────────────────────────────
function GrowthChart({
  data,
}: {
  data: {
    date: string;
    height_cm?: number | null;
    weight_kg?: number | null;
  }[];
}) {
  if (data.length < 2) return null;
  const sorted = [...data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-6);

  const heights = sorted.map((d) => d.height_cm ?? 0).filter(Boolean);
  const weights = sorted.map((d) => d.weight_kg ?? 0).filter(Boolean);
  if (!heights.length && !weights.length) return null;

  const W = 480,
    H = 140,
    PAD = 30;
  const xStep = (W - PAD * 2) / (sorted.length - 1);

  function toPoints(values: number[]) {
    const min = Math.min(...values) - 1;
    const max = Math.max(...values) + 1;
    return values.map((v, i) => {
      const x = PAD + i * xStep;
      const y = PAD + ((max - v) / (max - min)) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
  }

  const hPts = heights.length === sorted.length ? toPoints(heights) : [];
  const wPts = weights.length === sorted.length ? toPoints(weights) : [];

  const labels = sorted.map((d) => {
    const parts = d.date.split("-");
    const months = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return months[parseInt(parts[1])] ?? parts[1];
  });

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold text-foreground text-center">
        Tren Pertumbuhan ({sorted.length} Data Terakhir)
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line
            key={i}
            x1={PAD}
            y1={PAD + f * (H - PAD * 2)}
            x2={W - PAD}
            y2={PAD + f * (H - PAD * 2)}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        {/* Tinggi line — teal */}
        {hPts.length > 1 && (
          <>
            <polyline
              points={hPts.join(" ")}
              fill="none"
              stroke="#426653"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {hPts.map((pt, i) => {
              const [x, y] = pt.split(",");
              return <circle key={i} cx={x} cy={y} r="4" fill="#426653" />;
            })}
          </>
        )}
        {/* Berat line — biru */}
        {wPts.length > 1 && (
          <>
            <polyline
              points={wPts.join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {wPts.map((pt, i) => {
              const [x, y] = pt.split(",");
              return <circle key={i} cx={x} cy={y} r="4" fill="#3b82f6" />;
            })}
          </>
        )}
        {/* X labels */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={PAD + i * xStep}
            y={H - 4}
            textAnchor="middle"
            fontSize="11"
            fill="#9ca3af"
          >
            {l}
          </text>
        ))}
      </svg>
      {/* Legend */}
      <div className="mt-2 flex justify-center gap-4">
        {hPts.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-4 rounded-full bg-primary-600 inline-block" />{" "}
            Tinggi (cm)
          </div>
        )}
        {wPts.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-4 rounded-full bg-blue-500 inline-block" />{" "}
            Berat (kg)
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KidsPage() {
  const { data: kids = [], isLoading, isError, refetch } = useKids();
  const [selectedKid, setSelectedKid] = useState<KidProfile | null>(null);
  const [activeTab, setActiveTab] = useState<KidTab>("growth");
  const [showAddKid, setShowAddKid] = useState(false);

  // Add-kid form state
  const [kidName, setKidName] = useState("");
  const [kidGender, setKidGender] = useState("male");
  const [kidBirth, setKidBirth] = useState("");
  const createKid = useCreateKid();

  const kid = selectedKid ?? kids[0] ?? null;
  const kidId = kid?.id ?? "";

  const growthQuery = useGrowth(kidId);
  const { data: growth = [] } = growthQuery;
  const vaccinesQuery = useVaccines(kidId);
  const { data: vaccines = [] } = vaccinesQuery;
  const milestonesQuery = useMilestones(kidId);
  const { data: milestones = [] } = milestonesQuery;
  const healthQuery = useHealthRecords(kidId);
  const { data: health = [] } = healthQuery;

  const addGrowth = useAddGrowth(kidId);
  const markVaccine = useMarkVaccineGiven(kidId);
  const toggleMilestone = useToggleMilestone(kidId);
  const addHealth = useAddHealth(kidId);

  const [growthForm, setGrowthForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    height_cm: "",
    weight_kg: "",
  });
  const [healthForm, setHealthForm] = useState({
    type: "illness",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    doctor: "",
  });
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [showHealthForm, setShowHealthForm] = useState(false);

  const handleCreateKid = async () => {
    if (!kidName || !kidBirth) return;
    try {
      const k = await createKid.mutateAsync({
        name: kidName,
        gender: kidGender,
        birth_date: kidBirth,
      });
      setSelectedKid(k);
      setShowAddKid(false);
      setKidName("");
      setKidBirth("");
      toast.success("Profil anak dibuat");
    } catch {
      toast.error("Gagal membuat profil");
    }
  };

  const handleAddGrowth = async () => {
    try {
      await addGrowth.mutateAsync({
        date: growthForm.date,
        height_cm: growthForm.height_cm
          ? Number(growthForm.height_cm)
          : undefined,
        weight_kg: growthForm.weight_kg
          ? Number(growthForm.weight_kg)
          : undefined,
      });
      setShowGrowthForm(false);
      toast.success("Data pertumbuhan ditambahkan");
    } catch {
      toast.error("Gagal menyimpan");
    }
  };

  const handleAddHealth = async () => {
    if (!healthForm.description) return;
    try {
      await addHealth.mutateAsync(healthForm);
      setShowHealthForm(false);
      toast.success("Catatan kesehatan ditambahkan");
    } catch {
      toast.error("Gagal menyimpan");
    }
  };

  if (isLoading)
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );

  const activeQuery = {
    growth: growthQuery,
    vaccines: vaccinesQuery,
    milestones: milestonesQuery,
    health: healthQuery,
  }[activeTab];
  if (isError) return <QueryError retry={() => void refetch()} />;

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <PageHeader
        title="Anak"
        description="Temani setiap langkah tumbuh kembang si kecil."
        action={
          <>
            <button
              onClick={() => setShowAddKid(true)}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Tambah Anak
            </button>
          </>
        }
      />

      {/* ── Form tambah anak ──────────────────────────────────────── */}
      {showAddKid && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-primary-800">
            Profil Anak Baru
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs text-foreground"
                htmlFor="field-page-dashboardkids-0"
              >
                Nama *
              </label>
              <input
                value={kidName}
                onChange={(e) => setKidName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
                placeholder="Nama anak"
                id="field-page-dashboardkids-0"
              />
            </div>
            <div>
              <label
                className="text-xs text-foreground"
                htmlFor="field-page-dashboardkids-1"
              >
                Tanggal Lahir *
              </label>
              <input
                type="date"
                value={kidBirth}
                onChange={(e) => setKidBirth(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
                id="field-page-dashboardkids-1"
              />
            </div>
            <div>
              <label
                className="text-xs text-foreground"
                htmlFor="field-page-dashboardkids-2"
              >
                Jenis Kelamin
              </label>
              <select
                value={kidGender}
                onChange={(e) => setKidGender(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-card px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
                id="field-page-dashboardkids-2"
              >
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateKid}
              disabled={createKid.isPending}
              size="sm"
              className="bg-primary-600 hover:bg-primary-700"
            >
              Simpan
            </Button>
            <Button
              onClick={() => setShowAddKid(false)}
              variant="outline"
              size="sm"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {kids.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border dark:border-border bg-card dark:bg-card py-10 text-center">
          <Baby className="mb-3 h-12 w-12 text-neutral-200" />
          <p className="text-sm font-medium text-muted-foreground">
            Belum ada profil anak
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Klik &quot;Tambah Anak&quot; untuk membuat profil pertama
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {/* ── Sidebar daftar anak — sesuai mockup ─────────────── */}
          <div className="lg:col-span-1 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
              Daftar Anak
            </p>

            {kids.map((k) => (
              <button
                key={k.id}
                onClick={() => {
                  setSelectedKid(k);
                  setActiveTab("growth");
                }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                  kid?.id === k.id
                    ? "border-primary-300 bg-primary-50 dark:bg-primary-950 shadow-sm"
                    : "border-border dark:border-border bg-card dark:bg-card hover:shadow-sm",
                )}
                aria-label="Berikutnya"
              >
                {/* Avatar bulat warna */}
                <div
                  className={cn(
                    "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-base font-bold text-white",
                    k.gender === "female" ? "bg-pink-400" : "bg-sky-500",
                  )}
                >
                  {k.name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground dark:text-neutral-50 truncate">
                    {k.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ageLabel(k.birth_date)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-300 flex-shrink-0" />
              </button>
            ))}

            {/* Tambah profil dashed */}
            <button
              onClick={() => setShowAddKid(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3.5 text-sm font-medium text-muted-foreground hover:border-primary-300 hover:text-primary-600 transition-colors"
            >
              <Plus className="h-4 w-4" /> Tambah Profil
            </button>
          </div>

          {/* ── Detail panel ─────────────────────────────────────── */}
          {kid && (
            <div className="lg:col-span-3 space-y-4">
              {/* Tab bar — sesuai mockup: pill aktif teal, icon + label */}
              <div className="bg-card dark:bg-card rounded-xl border border-border dark:border-border p-1.5 flex gap-1">
                {TABS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setActiveTab(value)}
                    aria-pressed={activeTab === value}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs sm:text-sm font-medium transition-colors",
                      activeTab === value
                        ? "bg-primary-600 text-white shadow-sm"
                        : "text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-neutral-100 hover:bg-muted dark:hover:bg-neutral-800",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {activeQuery.isError && (
                <QueryError retry={() => void activeQuery.refetch()} />
              )}
              {activeQuery.isPending && (
                <Skeleton className="h-40 rounded-2xl" />
              )}
              {/* ── Growth Tab ─────────────────────────────────────── */}
              {activeTab === "growth" &&
                !activeQuery.isError &&
                !activeQuery.isPending && (
                  <div className="bg-card dark:bg-card rounded-xl border border-border dark:border-border overflow-hidden">
                    {/* Header tabel */}
                    <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-50 dark:border-border">
                      <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
                        Catatan Pertumbuhan
                      </h3>
                      <button
                        onClick={() => setShowGrowthForm((v) => !v)}
                        className="flex items-center gap-1.5 rounded-lg border border-border dark:border-border px-3 py-1.5 text-xs font-medium text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-neutral-800 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Catat Baru
                      </button>
                    </div>

                    {/* Form inline */}
                    {showGrowthForm && (
                      <div className="px-4 py-4 bg-muted dark:bg-muted border-b border-border dark:border-border">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label
                              className="text-xs text-muted-foreground"
                              htmlFor="field-page-dashboardkids-3"
                            >
                              Tanggal
                            </label>
                            <input
                              type="date"
                              value={growthForm.date}
                              onChange={(e) =>
                                setGrowthForm((f) => ({
                                  ...f,
                                  date: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                              id="field-page-dashboardkids-3"
                            />
                          </div>
                          <div>
                            <label
                              className="text-xs text-muted-foreground"
                              htmlFor="field-page-dashboardkids-4"
                            >
                              Tinggi (cm)
                            </label>
                            <input
                              type="number"
                              value={growthForm.height_cm}
                              onChange={(e) =>
                                setGrowthForm((f) => ({
                                  ...f,
                                  height_cm: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                              placeholder="0"
                              id="field-page-dashboardkids-4"
                            />
                          </div>
                          <div>
                            <label
                              className="text-xs text-muted-foreground"
                              htmlFor="field-page-dashboardkids-5"
                            >
                              Berat (kg)
                            </label>
                            <input
                              type="number"
                              value={growthForm.weight_kg}
                              onChange={(e) =>
                                setGrowthForm((f) => ({
                                  ...f,
                                  weight_kg: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                              placeholder="0"
                              id="field-page-dashboardkids-5"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            onClick={handleAddGrowth}
                            disabled={addGrowth.isPending}
                            size="sm"
                            className="bg-primary-600 hover:bg-primary-700"
                          >
                            Simpan
                          </Button>
                          <Button
                            onClick={() => setShowGrowthForm(false)}
                            variant="outline"
                            size="sm"
                          >
                            Batal
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Header kolom tabel */}
                    {growth.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-muted dark:bg-muted border-b border-border dark:border-border">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Tanggal
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Tinggi Badan
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Berat Badan
                        </span>
                      </div>
                    )}

                    {/* Rows */}
                    {growth.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Belum ada data pertumbuhan
                      </p>
                    ) : (
                      [...growth]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((g, idx) => (
                          <div
                            key={g.id}
                            className="grid grid-cols-3 items-center gap-2 px-4 py-4 border-b border-neutral-50 dark:border-border last:border-0"
                          >
                            <div>
                              <p className="text-sm font-semibold text-foreground dark:text-foreground">
                                {new Date(g.date).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {relativeDate(g.date)}
                              </p>
                            </div>
                            <div>
                              {g.height_cm ? (
                                <span
                                  className={cn(
                                    "inline-block rounded-lg px-3 py-1 text-sm font-semibold",
                                    idx === 0
                                      ? "bg-primary-50 text-primary-700"
                                      : "text-foreground",
                                  )}
                                >
                                  {g.height_cm} cm
                                </span>
                              ) : (
                                <span className="text-neutral-300">—</span>
                              )}
                            </div>
                            <div>
                              {g.weight_kg ? (
                                <span
                                  className={cn(
                                    "inline-block rounded-lg px-3 py-1 text-sm font-semibold",
                                    idx === 0
                                      ? "bg-blue-50 text-blue-700"
                                      : "text-foreground",
                                  )}
                                >
                                  {g.weight_kg} kg
                                </span>
                              ) : (
                                <span className="text-neutral-300">—</span>
                              )}
                            </div>
                          </div>
                        ))
                    )}

                    {/* Chart tren */}
                    {growth.length >= 2 && (
                      <div className="px-4 pb-5">
                        <GrowthChart data={growth} />
                      </div>
                    )}
                  </div>
                )}

              {/* ── Vaccine Tab ─────────────────────────────────────── */}
              {activeTab === "vaccines" &&
                !activeQuery.isError &&
                !activeQuery.isPending && (
                  <div className="bg-card dark:bg-card rounded-xl border border-border dark:border-border overflow-hidden">
                    <div className="px-4 py-4 border-b border-neutral-50 dark:border-border">
                      <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
                        Jadwal Vaksinasi
                      </h3>
                    </div>
                    {vaccines.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Belum ada data vaksin
                      </p>
                    ) : (
                      <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                        {vaccines.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center justify-between px-4 py-4"
                          >
                            <div>
                              <p className="text-sm font-semibold text-foreground dark:text-foreground">
                                {v.vaccine_name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Jadwal: {v.scheduled_date}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                  VACCINE_STATUS_STYLE[v.status],
                                )}
                              >
                                {v.status === "given"
                                  ? "Sudah"
                                  : v.status === "overdue"
                                    ? "Terlambat"
                                    : "Belum"}
                              </span>
                              {v.status !== "given" && (
                                <button
                                  onClick={() =>
                                    markVaccine.mutate({
                                      vaccineId: v.id,
                                      given_date: new Date()
                                        .toISOString()
                                        .slice(0, 10),
                                    })
                                  }
                                  className="rounded-lg border border-primary-400 px-2.5 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                                >
                                  Tandai ✓
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              {/* ── Milestone Tab ─────────────────────────────────── */}
              {activeTab === "milestones" &&
                !activeQuery.isError &&
                !activeQuery.isPending && (
                  <div className="bg-card dark:bg-card rounded-xl border border-border dark:border-border overflow-hidden">
                    <div className="px-4 py-4 border-b border-neutral-50 dark:border-border">
                      <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
                        Milestone Tumbuh Kembang
                      </h3>
                    </div>
                    {milestones.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Belum ada milestone
                      </p>
                    ) : (
                      <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                        {milestones.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => toggleMilestone.mutate(m.id)}
                            className={cn(
                              "w-full flex items-center gap-4 px-4 py-4 text-left transition-colors",
                              m.is_achieved
                                ? "bg-success-50/40"
                                : "hover:bg-muted dark:hover:bg-neutral-800",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
                                m.is_achieved
                                  ? "bg-success-500 text-white"
                                  : "border-2 border-neutral-300",
                              )}
                            >
                              {m.is_achieved && (
                                <span className="text-xs">✓</span>
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "text-sm font-medium",
                                  m.is_achieved
                                    ? "text-success-700 line-through"
                                    : "text-foreground",
                                )}
                              >
                                {m.title}
                              </p>
                              {m.category && (
                                <p className="text-xs text-muted-foreground">
                                  {m.category}
                                </p>
                              )}
                            </div>
                            {m.achieved_at && (
                              <p className="text-xs text-muted-foreground flex-shrink-0">
                                {m.achieved_at}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              {/* ── Health Tab ──────────────────────────────────────── */}
              {activeTab === "health" &&
                !activeQuery.isError &&
                !activeQuery.isPending && (
                  <div className="bg-card dark:bg-card rounded-xl border border-border dark:border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-50 dark:border-border">
                      <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
                        Catatan Kesehatan
                      </h3>
                      <button
                        onClick={() => setShowHealthForm((v) => !v)}
                        className="flex items-center gap-1.5 rounded-lg border border-border dark:border-border px-3 py-1.5 text-xs font-medium text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-neutral-800 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Catat Baru
                      </button>
                    </div>

                    {showHealthForm && (
                      <div className="px-4 py-4 bg-muted dark:bg-muted border-b border-border dark:border-border space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              className="text-xs text-muted-foreground"
                              htmlFor="field-page-dashboardkids-6"
                            >
                              Tanggal
                            </label>
                            <input
                              type="date"
                              value={healthForm.date}
                              onChange={(e) =>
                                setHealthForm((f) => ({
                                  ...f,
                                  date: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                              id="field-page-dashboardkids-6"
                            />
                          </div>
                          <div>
                            <label
                              className="text-xs text-muted-foreground"
                              htmlFor="field-page-dashboardkids-7"
                            >
                              Tipe
                            </label>
                            <select
                              value={healthForm.type}
                              onChange={(e) =>
                                setHealthForm((f) => ({
                                  ...f,
                                  type: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-neutral-300 bg-card px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                              id="field-page-dashboardkids-7"
                            >
                              <option value="illness">Sakit</option>
                              <option value="checkup">Kontrol</option>
                              <option value="dental">Gigi</option>
                              <option value="other">Lainnya</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label
                              className="text-xs text-muted-foreground"
                              htmlFor="field-page-dashboardkids-8"
                            >
                              Deskripsi *
                            </label>
                            <input
                              value={healthForm.description}
                              onChange={(e) =>
                                setHealthForm((f) => ({
                                  ...f,
                                  description: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                              placeholder="Keluhan / catatan"
                              id="field-page-dashboardkids-8"
                            />
                          </div>
                          <div>
                            <label
                              className="text-xs text-muted-foreground"
                              htmlFor="field-page-dashboardkids-9"
                            >
                              Dokter
                            </label>
                            <input
                              value={healthForm.doctor}
                              onChange={(e) =>
                                setHealthForm((f) => ({
                                  ...f,
                                  doctor: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                              placeholder="Nama dokter"
                              id="field-page-dashboardkids-9"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAddHealth}
                            disabled={addHealth.isPending}
                            size="sm"
                            className="bg-primary-600 hover:bg-primary-700"
                          >
                            Simpan
                          </Button>
                          <Button
                            onClick={() => setShowHealthForm(false)}
                            variant="outline"
                            size="sm"
                          >
                            Batal
                          </Button>
                        </div>
                      </div>
                    )}

                    {health.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Belum ada catatan kesehatan
                      </p>
                    ) : (
                      <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                        {health.map((h) => (
                          <div key={h.id} className="px-4 py-4">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground dark:text-foreground">
                                {h.description}
                              </p>
                              <span className="flex-shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground capitalize">
                                {h.type}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {h.date.slice(0, 10)}
                              {h.doctor && ` · dr. ${h.doctor}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
