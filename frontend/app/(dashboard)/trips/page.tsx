"use client";

import { EmptyIllustration } from "@/components/shared/EmptyIllustration";
import { QueryError } from "@/components/shared/QueryError";
import { PageHeader } from "@/components/shared/PageHeader";
import { ModalFrame } from "@/components/shared/ModalFrame";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Plane,
  Plus,
  Calendar,
  MapPin,
  Wallet,
  CheckCircle2,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useTrips, useCreateTrip, useDeleteTrip } from "@/hooks/useTrips";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import type { TripStatus } from "@/types";

export default function TripsPage() {
  const { data: trips = [], isLoading, isError, refetch } = useTrips();
  const { data: members = [] } = useFamilyMembers();
  const createTrip = useCreateTrip();
  const deleteTrip = useDeleteTrip();

  const [activeTab, setActiveTab] = useState<
    "all" | "planning" | "ongoing" | "completed"
  >("all");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    start_date: "",
    end_date: "",
    budget_estimate: 0,
    cover_image_url: "",
    notes: "",
    member_ids: [] as string[],
  });

  const filteredTrips = trips.filter((t) => {
    if (activeTab === "all") return true;
    return t.status === activeTab;
  });

  const handleMemberToggle = (memberId: string) => {
    setFormData((prev) => {
      const exists = prev.member_ids.includes(memberId);
      return {
        ...prev,
        member_ids: exists
          ? prev.member_ids.filter((id) => id !== memberId)
          : [...prev.member_ids, memberId],
      };
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.destination ||
      !formData.start_date ||
      !formData.end_date
    ) {
      return;
    }

    if (formData.end_date < formData.start_date) {
      toast.error("Tanggal pulang harus sesudah tanggal berangkat.");
      return;
    }
    try {
      await createTrip.mutateAsync({
        title: formData.title,
        destination: formData.destination,
        start_date: formData.start_date,
        end_date: formData.end_date,
        budget_estimate: Number(formData.budget_estimate) || 0,
        cover_image_url: formData.cover_image_url,
        notes: formData.notes,
        member_ids: formData.member_ids,
      });
    } catch {
      toast.error("Liburan belum berhasil disimpan. Coba lagi.");
      return;
    }
    setShowModal(false);
    setFormData({
      title: "",
      destination: "",
      start_date: "",
      end_date: "",
      budget_estimate: 0,
      cover_image_url: "",
      notes: "",
      member_ids: [],
    });
  };

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case "ongoing":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            Sedang Berlangsung
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-muted text-foreground dark:bg-muted dark:text-foreground">
            Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
            Perencanaan
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Liburan"
        description="Rencanakan perjalanan. Sisakan ruang untuk kenangan."
        action={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus size={17} />
            Rencanakan liburan
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border dark:border-border pb-2 overflow-x-auto">
        {(["all", "planning", "ongoing", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition capitalize whitespace-nowrap ${
              activeTab === tab
                ? "bg-neutral-900 text-white dark:bg-muted dark:text-foreground shadow-sm"
                : "text-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-neutral-100 hover:bg-muted dark:hover:bg-neutral-800/50"
            }`}
          >
            {tab === "all"
              ? "Semua Liburan"
              : tab === "planning"
                ? "Perencanaan"
                : tab === "ongoing"
                  ? "Sedang Jalan"
                  : "Selesai"}
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-neutral-200 dark:bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <QueryError retry={() => void refetch()} />
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-16 bg-card dark:bg-card rounded-2xl border border-dashed border-neutral-300 dark:border-border p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <EmptyIllustration name="travel" />
          </div>
          <h3 className="text-lg font-semibold">Belum ada rencana liburan</h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-md mx-auto mt-1 mb-6">
            Mulai rencanakan liburan akhir pekan atau liburan sekolah bersama
            keluarga sekarang!
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
          >
            <Plus className="w-4 h-4" /> Buat Rencana Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const packedCount =
              trip.packing_items?.filter((p) => p.is_packed).length ?? 0;
            const totalPacking = trip.packing_items?.length ?? 0;
            const packingProgress =
              totalPacking > 0
                ? Math.round((packedCount / totalPacking) * 100)
                : 0;

            return (
              <div
                key={trip.id}
                className="group relative bg-card dark:bg-card rounded-2xl border border-border/80 dark:border-border shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Cover Image / Header */}
                <div className="relative h-36 w-full bg-primary-100 dark:bg-primary-950 overflow-hidden">
                  {trip.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={trip.cover_image_url}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-primary-200">
                      <Plane className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(trip.status)}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full w-fit">
                      <MapPin className="w-3.5 h-3.5 text-rose-300" />
                      <span>{trip.destination}</span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground dark:text-foreground group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                      {trip.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(trip.start_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        -{" "}
                        {new Date(trip.end_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Packing Progress & Summary */}
                  <div className="space-y-2 pt-2 border-t border-border dark:border-border/80 text-xs text-foreground dark:text-muted-foreground">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{" "}
                        Packing
                      </span>
                      <span className="font-semibold text-foreground dark:text-foreground">
                        {packedCount}/{totalPacking} item ({packingProgress}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted dark:bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${packingProgress}%` }}
                      />
                    </div>

                    {(() => {
                      const itineraryBudgetTotal = (
                        trip.itineraries ?? []
                      ).reduce(
                        (sum, it) =>
                          sum +
                          (it.budget_items ?? []).reduce(
                            (s, b) => s + b.amount,
                            0,
                          ),
                        0,
                      );
                      return (
                        <div className="space-y-1 pt-1 text-xs">
                          {trip.budget_estimate > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1.5">
                                <Wallet className="w-3.5 h-3.5 text-amber-500" />{" "}
                                Estimasi Budget
                              </span>
                              <span className="font-semibold text-foreground dark:text-foreground">
                                Rp{" "}
                                {trip.budget_estimate.toLocaleString("id-ID")}
                              </span>
                            </div>
                          )}
                          {itineraryBudgetTotal > 0 && (
                            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                              <span>Total Budget Aktivitas</span>
                              <span className="font-semibold">
                                Rp{" "}
                                {itineraryBudgetTotal.toLocaleString("id-ID")}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        if (
                          confirm(`Yakin ingin menghapus trip "${trip.title}"?`)
                        ) {
                          deleteTrip.mutate(trip.id);
                        }
                      }}
                      className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Hapus Rencana"
                      aria-label="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/trips/${trip.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60 transition"
                    >
                      <span>Buka Detail & Jadwal</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat Trip */}
      {showModal && (
        <ModalFrame
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClose={() => setShowModal(false)}
        >
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary-600" /> Rencanakan
                Liburan Baru
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-dashboardtrips-0"
                >
                  Nama Rencana Liburan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Liburan Akhir Tahun ke Jogja"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-dashboardtrips-0"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-dashboardtrips-1"
                >
                  Destinasi / Kota *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Yogyakarta & Magelang"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-dashboardtrips-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                    htmlFor="field-page-dashboardtrips-2"
                  >
                    Tanggal Berangkat *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="field-page-dashboardtrips-2"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                    htmlFor="field-page-dashboardtrips-3"
                  >
                    Tanggal Pulang *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="field-page-dashboardtrips-3"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-dashboardtrips-4"
                >
                  Estimasi Total Budget (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Contoh: 5000000"
                  value={formData.budget_estimate || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget_estimate: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-dashboardtrips-4"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-dashboardtrips-5"
                >
                  URL Foto Sampul (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.cover_image_url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cover_image_url: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-dashboardtrips-5"
                />
              </div>

              {members.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-foreground dark:text-foreground mb-1.5">
                    Anggota Keluarga yang Ikut
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {members.map((m) => {
                      const selected = formData.member_ids.includes(m.id);
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => handleMemberToggle(m.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            selected
                              ? "bg-primary-600 text-white border-primary-600"
                              : "bg-muted dark:bg-muted text-foreground dark:text-foreground border-border dark:border-border"
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-dashboardtrips-6"
                >
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan penginapan, nomor kontak penting, dll."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-dashboardtrips-6"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border dark:border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted dark:hover:bg-neutral-800 text-foreground dark:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createTrip.isPending}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {createTrip.isPending ? "Menyimpan..." : "Simpan Liburan"}
                </button>
              </div>
            </form>
          </div>
        </ModalFrame>
      )}
    </div>
  );
}
