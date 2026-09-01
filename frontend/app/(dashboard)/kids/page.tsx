"use client";

import { useState } from "react";
import { differenceInMonths, formatDistanceToNow, parseISO } from "date-fns";
import { id as dateLocale } from "date-fns/locale";
import { Plus, Baby, TrendingUp, Syringe, Star, Heart, ChevronRight, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useKids, useGrowth, useVaccines, useMilestones, useHealthRecords,
  useCreateKid, useAddGrowth, useMarkVaccineGiven, useToggleMilestone, useAddHealth,
} from "@/hooks/useKids";
import type { KidProfile } from "@/types";

type KidTab = "growth" | "vaccines" | "milestones" | "health";

const TABS: { value: KidTab; label: string; icon: React.ElementType }[] = [
  { value: "growth",     label: "Pertumbuhan", icon: TrendingUp },
  { value: "vaccines",   label: "Vaksin",       icon: Syringe   },
  { value: "milestones", label: "Milestone",    icon: Star      },
  { value: "health",     label: "Kesehatan",    icon: Heart     },
];

const VACCINE_STATUS_STYLE = {
  given:     "bg-success-50 text-success-700",
  scheduled: "bg-info-50 text-info-700",
  overdue:   "bg-error-50 text-error-600 font-semibold",
};

function ageLabel(birthDate: string) {
  const months = differenceInMonths(new Date(), parseISO(birthDate));
  if (months < 12) return `${months} bulan`;
  const years = Math.floor(months / 12);
  const rem   = months % 12;
  return rem > 0 ? `${years} thn ${rem} bln` : `${years} tahun`;
}

function relativeDate(dateStr: string) {
  try {
    const d = parseISO(dateStr);
    const today = new Date().toISOString().slice(0, 10);
    if (dateStr === today) return "Hari ini";
    return formatDistanceToNow(d, { addSuffix: true, locale: dateLocale });
  } catch { return dateStr; }
}

// ── Mini SVG line chart ───────────────────────────────────────────────────────
function GrowthChart({ data }: { data: { date: string; height_cm?: number | null; weight_kg?: number | null }[] }) {
  if (data.length < 2) return null;
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date)).slice(-6);

  const heights = sorted.map(d => d.height_cm ?? 0).filter(Boolean);
  const weights = sorted.map(d => d.weight_kg ?? 0).filter(Boolean);
  if (!heights.length && !weights.length) return null;

  const W = 480, H = 140, PAD = 30;
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

  const labels = sorted.map(d => {
    const parts = d.date.split("-");
    const months = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return months[parseInt(parts[1])] ?? parts[1];
  });

  return (
    <div className="mt-4 rounded-xl border border-neutral-100 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-neutral-700 text-center">
        Tren Pertumbuhan ({sorted.length} Data Terakhir)
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line key={i} x1={PAD} y1={PAD + f * (H - PAD * 2)} x2={W - PAD} y2={PAD + f * (H - PAD * 2)}
            stroke="#e5e7eb" strokeWidth="1" />
        ))}
        {/* Tinggi line — teal */}
        {hPts.length > 1 && (
          <>
            <polyline points={hPts.join(" ")} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {hPts.map((pt, i) => { const [x, y] = pt.split(","); return <circle key={i} cx={x} cy={y} r="4" fill="#0d9488"/>; })}
          </>
        )}
        {/* Berat line — biru */}
        {wPts.length > 1 && (
          <>
            <polyline points={wPts.join(" ")} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {wPts.map((pt, i) => { const [x, y] = pt.split(","); return <circle key={i} cx={x} cy={y} r="4" fill="#3b82f6"/>; })}
          </>
        )}
        {/* X labels */}
        {labels.map((l, i) => (
          <text key={i} x={PAD + i * xStep} y={H - 4} textAnchor="middle" fontSize="11" fill="#9ca3af">{l}</text>
        ))}
      </svg>
      {/* Legend */}
      <div className="mt-2 flex justify-center gap-6">
        {hPts.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="h-2 w-4 rounded-full bg-teal-600 inline-block" /> Tinggi (cm)
          </div>
        )}
        {wPts.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="h-2 w-4 rounded-full bg-blue-500 inline-block" /> Berat (kg)
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KidsPage() {
  const { data: kids = [], isLoading } = useKids();
  const [selectedKid, setSelectedKid] = useState<KidProfile | null>(null);
  const [activeTab, setActiveTab]     = useState<KidTab>("growth");
  const [showAddKid, setShowAddKid]   = useState(false);

  // Add-kid form state
  const [kidName, setKidName]     = useState("");
  const [kidGender, setKidGender] = useState("male");
  const [kidBirth, setKidBirth]   = useState("");
  const createKid = useCreateKid();

  const kid   = selectedKid ?? kids[0] ?? null;
  const kidId = kid?.id ?? "";

  const { data: growth     = [] } = useGrowth(kidId);
  const { data: vaccines   = [] } = useVaccines(kidId);
  const { data: milestones = [] } = useMilestones(kidId);
  const { data: health     = [] } = useHealthRecords(kidId);

  const addGrowth       = useAddGrowth(kidId);
  const markVaccine     = useMarkVaccineGiven(kidId);
  const toggleMilestone = useToggleMilestone(kidId);
  const addHealth       = useAddHealth(kidId);

  const [growthForm, setGrowthForm] = useState({ date: new Date().toISOString().slice(0, 10), height_cm: "", weight_kg: "" });
  const [healthForm, setHealthForm] = useState({ type: "illness", description: "", date: new Date().toISOString().slice(0, 10), doctor: "" });
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [showHealthForm, setShowHealthForm] = useState(false);

  const handleCreateKid = async () => {
    if (!kidName || !kidBirth) return;
    try {
      const k = await createKid.mutateAsync({ name: kidName, gender: kidGender, birth_date: kidBirth });
      setSelectedKid(k);
      setShowAddKid(false);
      setKidName(""); setKidBirth("");
      toast.success("Profil anak dibuat");
    } catch { toast.error("Gagal membuat profil"); }
  };

  const handleAddGrowth = async () => {
    try {
      await addGrowth.mutateAsync({
        date: growthForm.date,
        height_cm: growthForm.height_cm ? Number(growthForm.height_cm) : undefined,
        weight_kg: growthForm.weight_kg ? Number(growthForm.weight_kg) : undefined,
      });
      setShowGrowthForm(false);
      toast.success("Data pertumbuhan ditambahkan");
    } catch { toast.error("Gagal menyimpan"); }
  };

  const handleAddHealth = async () => {
    if (!healthForm.description) return;
    try {
      await addHealth.mutateAsync(healthForm);
      setShowHealthForm(false);
      toast.success("Catatan kesehatan ditambahkan");
    } catch { toast.error("Gagal menyimpan"); }
  };

  if (isLoading) return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tracker Anak</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Pantau tumbuh kembang si kecil dengan detail.</p>
        </div>
        <button
          onClick={() => setShowAddKid(true)}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Tambah Anak
        </button>
      </div>

      {/* ── Form tambah anak ──────────────────────────────────────── */}
      {showAddKid && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-primary-800">Profil Anak Baru</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-600">Nama *</label>
              <input value={kidName} onChange={e => setKidName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
                placeholder="Nama anak" />
            </div>
            <div>
              <label className="text-xs text-neutral-600">Tanggal Lahir *</label>
              <input type="date" value={kidBirth} onChange={e => setKidBirth(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-600">Jenis Kelamin</label>
              <select value={kidGender} onChange={e => setKidGender(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none">
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateKid} disabled={createKid.isPending} size="sm" className="bg-primary-600 hover:bg-primary-700">Simpan</Button>
            <Button onClick={() => setShowAddKid(false)} variant="outline" size="sm">Batal</Button>
          </div>
        </div>
      )}

      {kids.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-16 text-center">
          <Baby className="mb-3 h-12 w-12 text-neutral-200" />
          <p className="text-sm font-medium text-neutral-500">Belum ada profil anak</p>
          <p className="mt-1 text-xs text-neutral-400">Klik &quot;Tambah Anak&quot; untuk membuat profil pertama</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">

          {/* ── Sidebar daftar anak — sesuai mockup ─────────────── */}
          <div className="lg:col-span-1 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 px-1">
              Daftar Anak
            </p>

            {kids.map((k) => (
              <button
                key={k.id}
                onClick={() => { setSelectedKid(k); setActiveTab("growth"); }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                  kid?.id === k.id
                    ? "border-primary-300 bg-primary-50 dark:bg-primary-950 shadow-sm"
                    : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:shadow-sm"
                )}
              >
                {/* Avatar bulat warna */}
                <div className={cn(
                  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-base font-bold text-white",
                  k.gender === "female" ? "bg-pink-400" : "bg-sky-500"
                )}>
                  {k.name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{k.name}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{ageLabel(k.birth_date)}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-300 flex-shrink-0" />
              </button>
            ))}

            {/* Tambah profil dashed */}
            <button
              onClick={() => setShowAddKid(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 py-3.5 text-sm font-medium text-neutral-400 hover:border-primary-300 hover:text-primary-600 transition-colors"
            >
              <Plus className="h-4 w-4" /> Tambah Profil
            </button>
          </div>

          {/* ── Detail panel ─────────────────────────────────────── */}
          {kid && (
            <div className="lg:col-span-3 space-y-4">

              {/* Tab bar — sesuai mockup: pill aktif teal, icon + label */}
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-1.5 flex gap-1">
                {TABS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                      activeTab === value
                        ? "bg-primary-600 text-white shadow-sm"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* ── Growth Tab ─────────────────────────────────────── */}
              {activeTab === "growth" && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                  {/* Header tabel */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-50 dark:border-neutral-800">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Catatan Pertumbuhan</h3>
                    <button
                      onClick={() => setShowGrowthForm(v => !v)}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Catat Baru
                    </button>
                  </div>

                  {/* Form inline */}
                  {showGrowthForm && (
                    <div className="px-5 py-4 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-neutral-500">Tanggal</label>
                          <input type="date" value={growthForm.date}
                            onChange={e => setGrowthForm(f => ({ ...f, date: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400" />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500">Tinggi (cm)</label>
                          <input type="number" value={growthForm.height_cm}
                            onChange={e => setGrowthForm(f => ({ ...f, height_cm: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                            placeholder="0" />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500">Berat (kg)</label>
                          <input type="number" value={growthForm.weight_kg}
                            onChange={e => setGrowthForm(f => ({ ...f, weight_kg: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                            placeholder="0" />
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button onClick={handleAddGrowth} disabled={addGrowth.isPending} size="sm" className="bg-primary-600 hover:bg-primary-700">Simpan</Button>
                        <Button onClick={() => setShowGrowthForm(false)} variant="outline" size="sm">Batal</Button>
                      </div>
                    </div>
                  )}

                  {/* Header kolom tabel */}
                  {growth.length > 0 && (
                    <div className="grid grid-cols-4 px-5 py-2 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Tanggal</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Tinggi Badan</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Berat Badan</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-right">Aksi</span>
                    </div>
                  )}

                  {/* Rows */}
                  {growth.length === 0 ? (
                    <p className="py-12 text-center text-sm text-neutral-400">Belum ada data pertumbuhan</p>
                  ) : (
                    [...growth]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((g, idx) => (
                        <div key={g.id} className="grid grid-cols-4 items-center px-5 py-4 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                              {new Date(g.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">{relativeDate(g.date)}</p>
                          </div>
                          <div>
                            {g.height_cm ? (
                              <span className={cn(
                                "inline-block rounded-lg px-3 py-1 text-sm font-semibold",
                                idx === 0 ? "bg-teal-50 text-teal-700" : "text-neutral-600"
                              )}>
                                {g.height_cm} cm
                              </span>
                            ) : <span className="text-neutral-300">—</span>}
                          </div>
                          <div>
                            {g.weight_kg ? (
                              <span className={cn(
                                "inline-block rounded-lg px-3 py-1 text-sm font-semibold",
                                idx === 0 ? "bg-blue-50 text-blue-700" : "text-neutral-600"
                              )}>
                                {g.weight_kg} kg
                              </span>
                            ) : <span className="text-neutral-300">—</span>}
                          </div>
                          <div className="flex justify-end">
                            <button className="p-1.5 rounded-lg text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}

                  {/* Chart tren */}
                  {growth.length >= 2 && (
                    <div className="px-5 pb-5">
                      <GrowthChart data={growth} />
                    </div>
                  )}
                </div>
              )}

              {/* ── Vaccine Tab ─────────────────────────────────────── */}
              {activeTab === "vaccines" && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-50 dark:border-neutral-800">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Jadwal Vaksinasi</h3>
                  </div>
                  {vaccines.length === 0 ? (
                    <p className="py-12 text-center text-sm text-neutral-400">Belum ada data vaksin</p>
                  ) : (
                    <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                      {vaccines.map(v => (
                        <div key={v.id} className="flex items-center justify-between px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{v.vaccine_name}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">Jadwal: {v.scheduled_date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", VACCINE_STATUS_STYLE[v.status])}>
                              {v.status === "given" ? "Sudah" : v.status === "overdue" ? "Terlambat" : "Belum"}
                            </span>
                            {v.status !== "given" && (
                              <button
                                onClick={() => markVaccine.mutate({ vaccineId: v.id, given_date: new Date().toISOString().slice(0, 10) })}
                                className="rounded-lg border border-teal-400 px-2.5 py-1 text-xs font-semibold text-teal-600 hover:bg-teal-50 transition-colors"
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
              {activeTab === "milestones" && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-50 dark:border-neutral-800">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Milestone Tumbuh Kembang</h3>
                  </div>
                  {milestones.length === 0 ? (
                    <p className="py-12 text-center text-sm text-neutral-400">Belum ada milestone</p>
                  ) : (
                    <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                      {milestones.map(m => (
                        <button key={m.id} onClick={() => toggleMilestone.mutate(m.id)}
                          className={cn("w-full flex items-center gap-4 px-5 py-4 text-left transition-colors",
                            m.is_achieved ? "bg-success-50/40" : "hover:bg-neutral-50 dark:hover:bg-neutral-800")}>
                          <span className={cn("flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
                            m.is_achieved ? "bg-success-500 text-white" : "border-2 border-neutral-300")}>
                            {m.is_achieved && <span className="text-[10px]">✓</span>}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-sm font-medium", m.is_achieved ? "text-success-700 line-through" : "text-neutral-800")}>{m.title}</p>
                            {m.category && <p className="text-xs text-neutral-400">{m.category}</p>}
                          </div>
                          {m.achieved_at && <p className="text-xs text-neutral-400 flex-shrink-0">{m.achieved_at}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Health Tab ──────────────────────────────────────── */}
              {activeTab === "health" && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-50 dark:border-neutral-800">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Catatan Kesehatan</h3>
                    <button
                      onClick={() => setShowHealthForm(v => !v)}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Catat Baru
                    </button>
                  </div>

                  {showHealthForm && (
                    <div className="px-5 py-4 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-neutral-500">Tanggal</label>
                          <input type="date" value={healthForm.date}
                            onChange={e => setHealthForm(f => ({ ...f, date: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400" />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500">Tipe</label>
                          <select value={healthForm.type}
                            onChange={e => setHealthForm(f => ({ ...f, type: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400">
                            <option value="illness">Sakit</option>
                            <option value="checkup">Kontrol</option>
                            <option value="dental">Gigi</option>
                            <option value="other">Lainnya</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-neutral-500">Deskripsi *</label>
                          <input value={healthForm.description}
                            onChange={e => setHealthForm(f => ({ ...f, description: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                            placeholder="Keluhan / catatan" />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500">Dokter</label>
                          <input value={healthForm.doctor}
                            onChange={e => setHealthForm(f => ({ ...f, doctor: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                            placeholder="Nama dokter" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddHealth} disabled={addHealth.isPending} size="sm" className="bg-primary-600 hover:bg-primary-700">Simpan</Button>
                        <Button onClick={() => setShowHealthForm(false)} variant="outline" size="sm">Batal</Button>
                      </div>
                    </div>
                  )}

                  {health.length === 0 ? (
                    <p className="py-12 text-center text-sm text-neutral-400">Belum ada catatan kesehatan</p>
                  ) : (
                    <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                      {health.map(h => (
                        <div key={h.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{h.description}</p>
                            <span className="flex-shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500 capitalize">{h.type}</span>
                          </div>
                          <p className="mt-1 text-xs text-neutral-400">
                            {h.date.slice(0, 10)}{h.doctor && ` · dr. ${h.doctor}`}
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
