"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plane,
  Plus,
  Calendar,
  MapPin,
  Wallet,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useTrips, useCreateTrip, useDeleteTrip } from "@/hooks/useTrips";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import type { TripStatus } from "@/types";

export default function TripsPage() {
  const { data: trips = [], isLoading } = useTrips();
  const { data: members = [] } = useFamilyMembers();
  const createTrip = useCreateTrip();
  const deleteTrip = useDeleteTrip();

  const [activeTab, setActiveTab] = useState<"all" | "planning" | "ongoing" | "completed">("all");
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
    if (!formData.title || !formData.destination || !formData.start_date || !formData.end_date) {
      return;
    }

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
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">Sedang Berlangsung</span>;
      case "completed":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">Selesai</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">Dibatalkan</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">Perencanaan</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Plane className="w-6 h-6 animate-pulse" />
              <span className="text-sm font-medium tracking-wide uppercase text-blue-100">Family Vacation Planner</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rencana Liburan Keluarga</h1>
            <p className="mt-1 text-blue-100 text-sm md:text-base max-w-xl">
              Atur jadwal perjalanan, checklist barang bawaan, dan estimasi biaya liburan agar momen santai keluarga lebih berkesan.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 font-semibold shadow hover:bg-blue-50 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Rencanakan Liburan</span>
          </button>
        </div>
        <div className="absolute -right-6 -bottom-10 opacity-15 pointer-events-none">
          <Plane className="w-64 h-64" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
        {(["all", "planning", "ongoing", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition capitalize whitespace-nowrap ${
              activeTab === tab
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
            }`}
          >
            {tab === "all" ? "Semua Liburan" : tab === "planning" ? "Perencanaan" : tab === "ongoing" ? "Sedang Jalan" : "Selesai"}
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold">Belum ada rencana liburan</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            Mulai rencanakan liburan akhir pekan atau liburan sekolah bersama keluarga sekarang!
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Buat Rencana Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const packedCount = trip.packing_items?.filter((p) => p.is_packed).length ?? 0;
            const totalPacking = trip.packing_items?.length ?? 0;
            const packingProgress = totalPacking > 0 ? Math.round((packedCount / totalPacking) * 100) : 0;

            return (
              <div
                key={trip.id}
                className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Cover Image / Header */}
                <div className="relative h-36 w-full bg-gradient-to-tr from-blue-700 to-indigo-600 overflow-hidden">
                  {trip.cover_image_url ? (
                    <img
                      src={trip.cover_image_url}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      <Plane className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">{getStatusBadge(trip.status)}</div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full w-fit">
                      <MapPin className="w-3.5 h-3.5 text-rose-300" />
                      <span>{trip.destination}</span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {trip.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(trip.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} -{" "}
                        {new Date(trip.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Packing Progress & Summary */}
                  <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-600 dark:text-neutral-400">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Packing
                      </span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                        {packedCount}/{totalPacking} item ({packingProgress}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${packingProgress}%` }}
                      />
                    </div>

                    {(() => {
                      const itineraryBudgetTotal = (trip.itineraries ?? []).reduce(
                        (sum, it) => sum + (it.budget_items ?? []).reduce((s, b) => s + b.amount, 0),
                        0
                      );
                      return (
                        <div className="space-y-1 pt-1 text-xs">
                          {trip.budget_estimate > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1.5">
                                <Wallet className="w-3.5 h-3.5 text-amber-500" /> Estimasi Budget
                              </span>
                              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                Rp {trip.budget_estimate.toLocaleString("id-ID")}
                              </span>
                            </div>
                          )}
                          {itineraryBudgetTotal > 0 && (
                            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                              <span>Total Budget Aktivitas</span>
                              <span className="font-semibold">
                                Rp {itineraryBudgetTotal.toLocaleString("id-ID")}
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
                        if (confirm(`Yakin ingin menghapus trip "${trip.title}"?`)) {
                          deleteTrip.mutate(trip.id);
                        }
                      }}
                      className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Hapus Rencana"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/trips/${trip.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" /> Rencanakan Liburan Baru
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nama Rencana Liburan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Liburan Akhir Tahun ke Jogja"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Destinasi / Kota *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Yogyakarta & Magelang"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Tanggal Berangkat *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Tanggal Pulang *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Estimasi Total Budget (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Contoh: 5000000"
                  value={formData.budget_estimate || ""}
                  onChange={(e) => setFormData({ ...formData, budget_estimate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  URL Foto Sampul (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {members.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
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
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
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
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan penginapan, nomor kontak penting, dll."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createTrip.isPending}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {createTrip.isPending ? "Menyimpan..." : "Simpan Liburan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
