"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  Luggage,
  ListTodo,
  Info,
  DollarSign,
} from "lucide-react";
import {
  useTrip,
  useAddItinerary,
  useDeleteItinerary,
  useAddPackingItem,
  useTogglePackingItem,
  useDeletePackingItem,
} from "@/hooks/useTrips";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";

const PACKING_CATEGORIES = [
  "Pakaian",
  "Toiletries & Skincare",
  "Obat & P3K",
  "Elektronik & Charger",
  "Dokumen & Uang",
  "Perlengkapan Anak",
  "Lain-lain",
];

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: trip, isLoading } = useTrip(id);
  const { data: members = [] } = useFamilyMembers();

  const addItinerary = useAddItinerary(id);
  const deleteItinerary = useDeleteItinerary(id);
  const addPacking = useAddPackingItem(id);
  const togglePacking = useTogglePackingItem(id);
  const deletePacking = useDeletePackingItem(id);

  const [activeTab, setActiveTab] = useState<"itinerary" | "packing" | "overview">("itinerary");

  // Itinerary form modal
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [itineraryForm, setItineraryForm] = useState({
    day_number: 1,
    time_start: "09:00",
    time_end: "11:00",
    title: "",
    location: "",
    location_url: "",
    notes: "",
  });

  // Packing form modal
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [packingForm, setPackingForm] = useState({
    item_name: "",
    category: "Pakaian",
    assigned_to: "",
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-48 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="text-xl font-bold">Trip Tidak Ditemukan</h2>
        <Link href="/trips" className="mt-4 inline-block text-blue-600 hover:underline text-sm font-medium">
          ← Kembali ke daftar liburan
        </Link>
      </div>
    );
  }

  const itineraries = trip.itineraries ?? [];
  const packingItems = trip.packing_items ?? [];

  // Group itineraries by day
  const daysMap = itineraries.reduce((acc, item) => {
    if (!acc[item.day_number]) acc[item.day_number] = [];
    acc[item.day_number].push(item);
    return acc;
  }, {} as Record<number, typeof itineraries>);

  const sortedDayNumbers = Object.keys(daysMap)
    .map(Number)
    .sort((a, b) => a - b);

  const handleItinerarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itineraryForm.title) return;

    await addItinerary.mutateAsync({
      day_number: Number(itineraryForm.day_number),
      time_start: itineraryForm.time_start,
      time_end: itineraryForm.time_end,
      title: itineraryForm.title,
      location: itineraryForm.location,
      location_url: itineraryForm.location_url,
      notes: itineraryForm.notes,
    });

    setShowItineraryModal(false);
    setItineraryForm({
      day_number: 1,
      time_start: "09:00",
      time_end: "11:00",
      title: "",
      location: "",
      location_url: "",
      notes: "",
    });
  };

  const handlePackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packingForm.item_name) return;

    await addPacking.mutateAsync({
      item_name: packingForm.item_name,
      category: packingForm.category,
      assigned_to: packingForm.assigned_to || null,
    });

    setShowPackingModal(false);
    setPackingForm({
      item_name: "",
      category: "Pakaian",
      assigned_to: "",
    });
  };

  const packedCount = packingItems.filter((i) => i.is_packed).length;
  const packingProgress = packingItems.length > 0 ? Math.round((packedCount / packingItems.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Liburan
        </Link>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white min-h-[220px] shadow-lg flex flex-col justify-end p-6 md:p-8">
        {trip.cover_image_url && (
          <img
            src={trip.cover_image_url}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover opacity-40 filter brightness-90"
          />
        )}
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
              <MapPin className="w-3 h-3 text-rose-300" /> {trip.destination}
            </span>
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
              <Calendar className="w-3 h-3 text-blue-300" />
              {new Date(trip.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} -{" "}
              {new Date(trip.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{trip.title}</h1>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab("itinerary")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "itinerary"
              ? "bg-blue-600 text-white shadow"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <ListTodo className="w-4 h-4" /> Jadwal & Itinerary
        </button>
        <button
          onClick={() => setActiveTab("packing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "packing"
              ? "bg-blue-600 text-white shadow"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Luggage className="w-4 h-4" /> Packing Checklist ({packedCount}/{packingItems.length})
        </button>
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "overview"
              ? "bg-blue-600 text-white shadow"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Info className="w-4 h-4" /> Info & Catatan
        </button>
      </div>

      {/* ─── TAB 1: ITINERARY ────────────────────────────────────────────── */}
      {activeTab === "itinerary" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Rencana Aktivitas Per Hari</h2>
            <button
              onClick={() => setShowItineraryModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Tambah Aktivitas
            </button>
          </div>

          {itineraries.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-6">
              <Clock className="w-10 h-10 mx-auto mb-2 text-neutral-400" />
              <h3 className="font-semibold text-sm">Belum ada agenda perjalanan</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4">Tambahkan jadwal kegiatan seru untuk hari pertama dan seterusnya.</p>
              <button
                onClick={() => setShowItineraryModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                + Tambah Agenda
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDayNumbers.map((dayNum) => (
                <div
                  key={dayNum}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      H{dayNum}
                    </span>
                    <h3 className="font-bold text-sm">Hari ke-{dayNum}</h3>
                  </div>

                  <div className="space-y-3">
                    {daysMap[dayNum].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {(item.time_start || item.time_end) && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                {item.time_start} {item.time_end ? `- ${item.time_end}` : ""}
                              </span>
                            )}
                            <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{item.title}</h4>
                          </div>

                          {item.location && (
                            <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              <span>{item.location}</span>
                              {item.location_url && (
                                <a
                                  href={item.location_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 ml-1"
                                >
                                  (Google Maps <ExternalLink className="w-2.5 h-2.5" />)
                                </a>
                              )}
                            </div>
                          )}

                          {item.notes && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-300 pt-1 whitespace-pre-line">{item.notes}</p>
                          )}
                        </div>

                        <button
                          onClick={() => deleteItinerary.mutate(item.id)}
                          className="text-neutral-400 hover:text-rose-600 p-1 rounded-lg transition"
                          title="Hapus Agenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: PACKING CHECKLIST ────────────────────────────────────── */}
      {activeTab === "packing" && (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 w-full md:w-auto">
              <h2 className="text-base font-bold">Progress Perlengkapan</h2>
              <p className="text-xs text-neutral-500">
                {packedCount} dari {packingItems.length} barang sudah siap ({packingProgress}%)
              </p>
              <div className="w-full md:w-64 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${packingProgress}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => setShowPackingModal(true)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Tambah Barang Bawaan
            </button>
          </div>

          {/* Packing Items List */}
          {packingItems.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-6">
              <Luggage className="w-10 h-10 mx-auto mb-2 text-neutral-400" />
              <h3 className="font-semibold text-sm">Daftar packing masih kosong</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4">Catat semua perlengkapan agar tidak ada barang yang tertinggal.</p>
              <button
                onClick={() => setShowPackingModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                + Tambah Barang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packingItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition ${
                    item.is_packed
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.is_packed}
                      onChange={() => togglePacking.mutate(item.id)}
                      className="w-5 h-5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold truncate ${
                          item.is_packed
                            ? "line-through text-neutral-400 dark:text-neutral-500"
                            : "text-neutral-900 dark:text-neutral-100"
                        }`}
                      >
                        {item.item_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                        <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-medium">
                          {item.category}
                        </span>
                        {item.assignee && (
                          <span className="text-neutral-600 dark:text-neutral-400">
                            PIC: <b>{item.assignee.name}</b>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deletePacking.mutate(item.id)}
                    className="text-neutral-400 hover:text-rose-600 p-1 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: OVERVIEW & NOTES ─────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info & Catatan */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" /> Catatan & Akomodasi
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
              {trip.notes || "Belum ada catatan detail perjalanan."}
            </p>
          </div>

          {/* Peserta & Budget */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-indigo-600" /> Peserta Liburan
              </h3>
              <div className="flex flex-wrap gap-2">
                {trip.members && trip.members.length > 0 ? (
                  trip.members.map((m) => (
                    <span
                      key={m.id}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
                    >
                      {m.name} ({m.role})
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-500">Semua anggota keluarga</span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-base flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Estimasi Anggaran
              </h3>
              <p className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                Rp {(trip.budget_estimate || 0).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Itinerary */}
      {showItineraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Tambah Jadwal Aktivitas</h3>
            <form onSubmit={handleItinerarySubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Hari ke- *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itineraryForm.day_number}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, day_number: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={itineraryForm.time_start}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, time_start: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={itineraryForm.time_end}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, time_end: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Nama Aktivitas / Kegiatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sarapan Gudeg & Menuju Candi Borobudur"
                  value={itineraryForm.title}
                  onChange={(e) => setItineraryForm({ ...itineraryForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Lokasi</label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Malioboro"
                  value={itineraryForm.location}
                  onChange={(e) => setItineraryForm({ ...itineraryForm, location: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Link Google Maps (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={itineraryForm.location_url}
                  onChange={(e) => setItineraryForm({ ...itineraryForm, location_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Catatan / Tips</label>
                <textarea
                  rows={2}
                  placeholder="Beli tiket online, pakai baju hangat, dll."
                  value={itineraryForm.notes}
                  onChange={(e) => setItineraryForm({ ...itineraryForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowItineraryModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addItinerary.isPending}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Packing Item */}
      {showPackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Tambah Barang Bawaan</h3>
            <form onSubmit={handlePackingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Barang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Powerbank, Jaket Anak, Obat Alergi"
                  value={packingForm.item_name}
                  onChange={(e) => setPackingForm({ ...packingForm, item_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Kategori</label>
                <select
                  value={packingForm.category}
                  onChange={(e) => setPackingForm({ ...packingForm, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                >
                  {PACKING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {members.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Penanggung Jawab (PIC)</label>
                  <select
                    value={packingForm.assigned_to}
                    onChange={(e) => setPackingForm({ ...packingForm, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  >
                    <option value="">Semua / Bersama</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowPackingModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addPacking.isPending}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
