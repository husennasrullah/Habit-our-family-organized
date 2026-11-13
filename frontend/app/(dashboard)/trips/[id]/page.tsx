"use client";

import { QueryError } from "@/components/shared/QueryError";
import { PageHeader } from "@/components/shared/PageHeader";
import { ModalFrame } from "@/components/shared/ModalFrame";

import { useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { ItineraryBoard } from "@/components/trips/ItineraryBoard";
import { TripBudgetSummary } from "@/components/trips/TripBudgetSummary";
import { TripExpensesPanel } from "@/components/trips/TripExpensesPanel";
import { tripDuration } from "@/lib/trips";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  Luggage,
  ListTodo,
  Info,
  DollarSign,
  Pencil,
  Receipt,
  FileText,
  UploadCloud,
  Download,
} from "lucide-react";
import {
  useTrip,
  downloadTripDocument,
  useUpdateTrip,
  useAddItinerary,
  useUpdateItinerary,
  useDeleteItinerary,
  useAddPackingItem,
  useTogglePackingItem,
  useDeletePackingItem,
  useUploadTripDocument,
  useDeleteTripDocument,
} from "@/hooks/useTrips";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import type { TripItinerary, TripStatus } from "@/types";

const PACKING_CATEGORIES = [
  "Pakaian",
  "Toiletries & Skincare",
  "Obat & P3K",
  "Elektronik & Charger",
  "Dokumen & Uang",
  "Perlengkapan Anak",
  "Lain-lain",
];

const STATUS_OPTIONS: { value: TripStatus; label: string }[] = [
  { value: "planning", label: "Perencanaan" },
  { value: "ongoing", label: "Sedang Berlangsung" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function TripDetailPage({
  params,
}: {
  params?: { id?: string };
}) {
  const routeParams = useParams();
  const id = (params?.id || routeParams?.id) as string;
  const { data: trip, isLoading, isError, refetch } = useTrip(id);
  const { data: members = [] } = useFamilyMembers();

  const updateTrip = useUpdateTrip();
  const addItinerary = useAddItinerary(id);
  const updateItinerary = useUpdateItinerary(id);
  const deleteItinerary = useDeleteItinerary(id);
  const addPacking = useAddPackingItem(id);
  const togglePacking = useTogglePackingItem(id);
  const deletePacking = useDeletePackingItem(id);
  const uploadDoc = useUploadTripDocument(id);
  const deleteDoc = useDeleteTripDocument(id);

  const [activeTab, setActiveTab] = useState<
    "itinerary" | "packing" | "expenses" | "documents" | "overview"
  >("itinerary");
  const saveError = (error: unknown) =>
    toast.error(
      isAxiosError(error) && typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : "Perubahan gagal disimpan. Coba lagi.",
    );
  const budgetPayload = (rows: BudgetRow[]) =>
    rows
      .filter((row) => row.label.trim() || row.amount)
      .map((row) => ({
        ...(row.id ? { id: row.id } : {}),
        label: row.label.trim(),
        amount: Number(row.amount),
      }));
  // ── Edit Trip modal ────────────────────────────────────────────────────────
  const [showEditTripModal, setShowEditTripModal] = useState(false);
  const [editTripForm, setEditTripForm] = useState({
    title: "",
    destination: "",
    start_date: "",
    end_date: "",
    budget_estimate: 0,
    cover_image_url: "",
    notes: "",
    status: "planning" as TripStatus,
    member_ids: [] as string[],
  });

  const openEditTripModal = () => {
    if (!trip) return;
    setEditTripForm({
      title: trip.title,
      destination: trip.destination,
      start_date: trip.start_date?.slice(0, 10) ?? "",
      end_date: trip.end_date?.slice(0, 10) ?? "",
      budget_estimate: trip.budget_estimate ?? 0,
      cover_image_url: trip.cover_image_url ?? "",
      notes: trip.notes ?? "",
      status: trip.status,
      member_ids: trip.members?.map((m) => m.id) ?? [],
    });
    setShowEditTripModal(true);
  };

  const handleEditTripSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      await updateTrip.mutateAsync({
        id,
        payload: {
          title: editTripForm.title,
          destination: editTripForm.destination,
          start_date: editTripForm.start_date,
          end_date: editTripForm.end_date,
          budget_estimate: Number(editTripForm.budget_estimate) || 0,
          cover_image_url: editTripForm.cover_image_url,
          notes: editTripForm.notes,
          status: editTripForm.status,
          member_ids: editTripForm.member_ids,
        },
      });
      setShowEditTripModal(false);
    } catch (error) {
      saveError(error);
    }
  };

  const handleEditTripMemberToggle = (memberId: string) => {
    setEditTripForm((prev) => ({
      ...prev,
      member_ids: prev.member_ids.includes(memberId)
        ? prev.member_ids.filter((id) => id !== memberId)
        : [...prev.member_ids, memberId],
    }));
  };

  // ── Add Itinerary modal ────────────────────────────────────────────────────
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
  type BudgetRow = { id?: string; label: string; amount: string };
  const [addBudgetRows, setAddBudgetRows] = useState<BudgetRow[]>([]);

  // ── Edit Itinerary modal ───────────────────────────────────────────────────
  const [editingItinerary, setEditingItinerary] =
    useState<TripItinerary | null>(null);
  const [editItineraryForm, setEditItineraryForm] = useState({
    day_number: 1,
    time_start: "09:00",
    time_end: "11:00",
    title: "",
    location: "",
    location_url: "",
    notes: "",
  });

  // budget rows di dalam modal edit
  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>([]);

  const openEditItineraryModal = (item: TripItinerary) => {
    setEditingItinerary(item);
    setEditItineraryForm({
      day_number: item.day_number,
      time_start: item.time_start ?? "09:00",
      time_end: item.time_end ?? "11:00",
      title: item.title,
      location: item.location ?? "",
      location_url: item.location_url ?? "",
      notes: item.notes ?? "",
    });
    // populate existing budget items sebagai rows
    setBudgetRows(
      (item.budget_items ?? []).map((b) => ({
        id: b.id,
        label: b.label,
        amount: String(b.amount),
      })),
    );
  };

  const handleEditItinerarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItinerary || updateItinerary.isPending) return;
    try {
      await updateItinerary.mutateAsync({
        itineraryId: editingItinerary.id,
        payload: {
          ...editItineraryForm,
          day_number: Number(editItineraryForm.day_number),
          budget_items: budgetPayload(budgetRows),
        },
      });
      setEditingItinerary(null);
      toast.success("Kegiatan dan rincian biaya disimpan");
    } catch (error) {
      saveError(error);
    }
  };

  // ── Packing modal ──────────────────────────────────────────────────────────
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [packingForm, setPackingForm] = useState({
    item_name: "",
    category: "Pakaian",
    assigned_to: "",
  });

  // ── Document modal ─────────────────────────────────────────────────────────
  const [showDocModal, setShowDocModal] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docForm, setDocForm] = useState({
    title: "",
    doc_type: "ticket" as "ticket" | "hotel" | "insurance" | "visa" | "other",
    notes: "",
  });

  // ── Manage Members modal ───────────────────────────────────────────────────
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const openMemberModal = () => {
    if (!trip) return;
    setSelectedMemberIds(trip.members?.map((m) => m.id) ?? []);
    setShowMemberModal(true);
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const handleSaveMembers = async () => {
    try {
      if (!trip) return;
      await updateTrip.mutateAsync({
        id,
        payload: {
          member_ids: selectedMemberIds,
        },
      });
      setShowMemberModal(false);
    } catch (error) {
      saveError(error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-w-0 space-y-4">
        <div className="h-48 rounded-2xl bg-neutral-200 dark:bg-muted animate-pulse" />
        <div className="h-64 rounded-2xl bg-neutral-200 dark:bg-muted animate-pulse" />
      </div>
    );
  }

  if (isError) return <QueryError retry={() => void refetch()} />;

  if (!trip) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="text-xl font-bold">Trip Tidak Ditemukan</h2>
        <Link
          href="/trips"
          className="mt-4 inline-block text-primary-600 hover:underline text-sm font-medium"
        >
          ← Kembali ke daftar liburan
        </Link>
      </div>
    );
  }

  const packingItems = trip.packing_items ?? [];

  const handleItinerarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addItinerary.isPending) return;
    try {
      await addItinerary.mutateAsync({
        ...itineraryForm,
        day_number: Number(itineraryForm.day_number),
        budget_items: budgetPayload(addBudgetRows),
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
      setAddBudgetRows([]);
      toast.success("Kegiatan dan rincian biaya disimpan");
    } catch (error) {
      saveError(error);
    }
  };
  const handlePackingSubmit = async (e: React.FormEvent) => {
    try {
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
    } catch (error) {
      saveError(error);
    }
  };

  const packedCount = packingItems.filter((i) => i.is_packed).length;
  const packingProgress =
    packingItems.length > 0
      ? Math.round((packedCount / packingItems.length) * 100)
      : 0;

  const documents = trip.documents ?? [];
  const expenses = trip.expenses ?? [];
  const handleDocSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!docFile) return;
      if (docFile.size > 10 * 1024 * 1024) {
        toast.error("Ukuran dokumen maksimal 10 MB");
        return;
      }

      const fd = new FormData();
      fd.append("file", docFile);
      fd.append("title", docForm.title || docFile.name);
      fd.append("doc_type", docForm.doc_type);
      fd.append("notes", docForm.notes);

      await uploadDoc.mutateAsync(fd);

      setShowDocModal(false);
      setDocFile(null);
      setDocForm({
        title: "",
        doc_type: "ticket",
        notes: "",
      });
    } catch (error) {
      saveError(error);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Liburan
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={openMemberModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-card text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-neutral-800 transition"
          >
            <Users className="w-4 h-4 text-indigo-600" /> Anggota (
            {trip.members?.length ?? 0})
          </button>
          <button
            onClick={openEditTripModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-card text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-neutral-800 transition"
          >
            <Pencil className="w-4 h-4" /> Edit Liburan
          </button>
        </div>
      </div>

      <PageHeader
        title={trip.title}
        description={`${trip.destination} · ${new Date(trip.start_date).toLocaleDateString("id-ID")} – ${new Date(trip.end_date).toLocaleDateString("id-ID")}`}
      />

      <TripBudgetSummary trip={trip} />
      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-border dark:border-border pb-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab("itinerary")}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
            activeTab === "itinerary"
              ? "bg-primary-600 text-white shadow"
              : "text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-neutral-800"
          }`}
        >
          <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Jadwal</span>
          <span className="hidden sm:inline">& Itinerary</span>
        </button>
        <button
          onClick={() => setActiveTab("packing")}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
            activeTab === "packing"
              ? "bg-primary-600 text-white shadow"
              : "text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-neutral-800"
          }`}
        >
          <Luggage className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>
            Packing ({packedCount}/{packingItems.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
            activeTab === "expenses"
              ? "bg-primary-600 text-white shadow"
              : "text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-neutral-800"
          }`}
        >
          <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Pengeluaran ({expenses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
            activeTab === "documents"
              ? "bg-primary-600 text-white shadow"
              : "text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-neutral-800"
          }`}
        >
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Dokumen</span>
          <span className="hidden sm:inline">& Tiket ({documents.length})</span>
          <span className="sm:hidden">({documents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
            activeTab === "overview"
              ? "bg-primary-600 text-white shadow"
              : "text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-neutral-800"
          }`}
        >
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Info</span>
          <span className="hidden sm:inline">& Catatan</span>
        </button>
      </div>

      {/* ─── TAB 1: ITINERARY ────────────────────────────────────────────── */}
      {activeTab === "itinerary" && (
        <ItineraryBoard
          trip={trip}
          onAdd={(day) => {
            if (day) setItineraryForm((v) => ({ ...v, day_number: day }));
            setShowItineraryModal(true);
          }}
          onEdit={openEditItineraryModal}
          onDelete={async (itemId) => {
            if (!confirm("Hapus kegiatan beserta rincian biayanya?")) return;
            try {
              await deleteItinerary.mutateAsync(itemId);
            } catch (error) {
              saveError(error);
            }
          }}
          deleting={deleteItinerary.isPending}
        />
      )}

      {activeTab === "packing" && (
        <div className="space-y-4">
          {/* Progress Header */}
          <div className="bg-card dark:bg-card p-4 rounded-2xl border border-border/80 dark:border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 w-full md:w-auto">
              <h2 className="text-base font-bold">Progress Perlengkapan</h2>
              <p className="text-xs text-muted-foreground">
                {packedCount} dari {packingItems.length} barang sudah siap (
                {packingProgress}%)
              </p>
              <div className="w-full md:w-64 h-2 bg-muted dark:bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${packingProgress}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => setShowPackingModal(true)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition"
            >
              <Plus className="w-4 h-4" /> Tambah Barang Bawaan
            </button>
          </div>

          {/* Packing Items List */}
          {packingItems.length === 0 ? (
            <div className="text-center py-8 bg-card dark:bg-card rounded-2xl border border-dashed border-neutral-300 dark:border-border p-4">
              <Luggage className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-semibold text-sm">
                Daftar packing masih kosong
              </h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Catat semua perlengkapan agar tidak ada barang yang tertinggal.
              </p>
              <button
                onClick={() => setShowPackingModal(true)}
                className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold"
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
                      : "bg-card dark:bg-card border-border dark:border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.is_packed}
                      onChange={() => {
                        void togglePacking
                          .mutateAsync(item.id)
                          .catch(saveError);
                      }}
                      disabled={togglePacking.isPending}
                      aria-label={`Tandai ${item.item_name} sudah disiapkan`}
                      className="w-5 h-5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold truncate ${
                          item.is_packed
                            ? "line-through text-muted-foreground dark:text-muted-foreground"
                            : "text-foreground dark:text-foreground"
                        }`}
                      >
                        {item.item_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="px-2 py-0.5 rounded bg-muted dark:bg-muted font-medium">
                          {item.category}
                        </span>
                        {item.assignee && (
                          <span className="text-foreground dark:text-muted-foreground">
                            PIC: <b>{item.assignee.name}</b>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm("Hapus barang bawaan ini?"))
                        void deletePacking
                          .mutateAsync(item.id)
                          .catch(saveError);
                    }}
                    disabled={deletePacking.isPending}
                    className="text-muted-foreground hover:text-rose-600 p-1 rounded-lg transition"
                    aria-label="Hapus"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Info & Catatan */}
          <div className="bg-card dark:bg-card p-4 rounded-2xl border border-border/80 dark:border-border shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-600" /> Catatan & Akomodasi
            </h3>
            <p className="text-sm text-foreground dark:text-foreground whitespace-pre-line leading-relaxed">
              {trip.notes || "Belum ada catatan detail perjalanan."}
            </p>
          </div>

          {/* Peserta & Budget */}
          <div className="bg-card dark:bg-card p-4 rounded-2xl border border-border/80 dark:border-border shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" /> Peserta Liburan
                </h3>
                <button
                  onClick={openMemberModal}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-950/50 px-2.5 py-1 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Kelola Peserta
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {trip.members && trip.members.length > 0 ? (
                  trip.members.map((m) => (
                    <span
                      key={m.id}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      {m.name} ({m.role})
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Semua anggota keluarga
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border dark:border-border">
              <h3 className="font-bold text-base flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Estimasi
                Anggaran
              </h3>
              <p className="text-2xl font-semibold text-foreground dark:text-foreground">
                Rp {(trip.budget_estimate || 0).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: EXPENSES & SPLIT BILL ─────────────────────────────────── */}
      {activeTab === "expenses" && <TripExpensesPanel trip={trip} />}

      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="bg-card dark:bg-card p-4 rounded-2xl border border-border/80 dark:border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold">
                Dokumen & E-Tiket Perjalanan
              </h2>
              <p className="text-xs text-muted-foreground">
                Simpan tiket penerbangan, kereta, voucher hotel, atau dokumen
                asuransi agar mudah diakses.
              </p>
            </div>
            <button
              onClick={() => setShowDocModal(true)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition"
            >
              <UploadCloud className="w-4 h-4" /> Upload Dokumen / Tiket
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-8 bg-card dark:bg-card rounded-2xl border border-dashed border-neutral-300 dark:border-border p-4">
              <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-semibold text-sm">
                Belum ada dokumen yang diunggah
              </h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Unggah tiket penerbangan, booking hotel, voucher wisata di sini.
              </p>
              <button
                onClick={() => setShowDocModal(true)}
                className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold"
              >
                + Upload Dokumen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => {
                const typeLabels: Record<
                  string,
                  { label: string; color: string }
                > = {
                  ticket: {
                    label: "Tiket Transport",
                    color:
                      "bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300",
                  },
                  hotel: {
                    label: "Voucher Hotel",
                    color:
                      "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
                  },
                  insurance: {
                    label: "Asuransi",
                    color:
                      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
                  },
                  visa: {
                    label: "Visa / Paspor",
                    color:
                      "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
                  },
                  other: {
                    label: "Lainnya",
                    color:
                      "bg-muted text-foreground dark:bg-muted dark:text-foreground",
                  },
                };
                const badge = typeLabels[doc.doc_type] || typeLabels.other;

                return (
                  <div
                    key={doc.id}
                    className="bg-card dark:bg-card p-4 rounded-2xl border border-border/80 dark:border-border shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        <button
                          onClick={() => {
                            if (window.confirm("Hapus dokumen perjalanan ini?"))
                              void deleteDoc
                                .mutateAsync(doc.id)
                                .catch(saveError);
                          }}
                          disabled={deleteDoc.isPending}
                          className="text-muted-foreground hover:text-rose-600 p-1 rounded-lg transition"
                          title="Hapus Dokumen"
                          aria-label="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-bold text-sm text-foreground dark:text-white line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {doc.file_name}
                      </p>

                      {doc.notes && (
                        <p className="text-xs text-foreground dark:text-muted-foreground bg-muted dark:bg-muted/50 p-2 rounded-lg">
                          {doc.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground">
                      <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                      <button
                        onClick={async () => {
                          try {
                            await downloadTripDocument(id, doc);
                          } catch (error) {
                            saveError(error);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-primary-700 dark:text-primary-200"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Unduh dokumen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: Edit Trip ─────────────────────────────────────────────── */}
      {showEditTripModal && (
        <ModalFrame
          className="trip-dialog fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClose={() => setShowEditTripModal(false)}
        >
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl w-full max-w-lg p-4 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary-600" /> Edit Rencana
                Liburan
              </h3>
              <button
                onClick={() => setShowEditTripModal(false)}
                className="text-muted-foreground hover:text-foreground dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditTripSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-tripsid-0"
                >
                  Nama Rencana Liburan *
                </label>
                <input
                  type="text"
                  required
                  value={editTripForm.title}
                  onChange={(e) =>
                    setEditTripForm({ ...editTripForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-tripsid-0"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-tripsid-1"
                >
                  Destinasi / Kota *
                </label>
                <input
                  type="text"
                  required
                  value={editTripForm.destination}
                  onChange={(e) =>
                    setEditTripForm({
                      ...editTripForm,
                      destination: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-tripsid-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                    htmlFor="field-page-tripsid-2"
                  >
                    Tanggal Berangkat *
                  </label>
                  <input
                    type="date"
                    required
                    value={editTripForm.start_date}
                    onChange={(e) =>
                      setEditTripForm({
                        ...editTripForm,
                        start_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="field-page-tripsid-2"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                    htmlFor="field-page-tripsid-3"
                  >
                    Tanggal Pulang *
                  </label>
                  <input
                    type="date"
                    required
                    value={editTripForm.end_date}
                    onChange={(e) =>
                      setEditTripForm({
                        ...editTripForm,
                        end_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="field-page-tripsid-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                    htmlFor="field-page-tripsid-4"
                  >
                    Status
                  </label>
                  <select
                    value={editTripForm.status}
                    onChange={(e) =>
                      setEditTripForm({
                        ...editTripForm,
                        status: e.target.value as TripStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="field-page-tripsid-4"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                    htmlFor="field-page-tripsid-5"
                  >
                    Estimasi Budget (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editTripForm.budget_estimate || ""}
                    onChange={(e) =>
                      setEditTripForm({
                        ...editTripForm,
                        budget_estimate: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="field-page-tripsid-5"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-tripsid-6"
                >
                  URL Foto Sampul (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editTripForm.cover_image_url}
                  onChange={(e) =>
                    setEditTripForm({
                      ...editTripForm,
                      cover_image_url: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-tripsid-6"
                />
              </div>

              {members.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-foreground dark:text-foreground mb-1.5">
                    Anggota Keluarga yang Ikut
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {members.map((m) => {
                      const selected = editTripForm.member_ids.includes(m.id);
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => handleEditTripMemberToggle(m.id)}
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
                  htmlFor="field-page-tripsid-7"
                >
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan penginapan, nomor kontak penting, dll."
                  value={editTripForm.notes}
                  onChange={(e) =>
                    setEditTripForm({ ...editTripForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-tripsid-7"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border dark:border-border">
                <button
                  type="button"
                  onClick={() => setShowEditTripModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted dark:hover:bg-neutral-800 text-foreground dark:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updateTrip.isPending}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {updateTrip.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </ModalFrame>
      )}

      {/* ─── MODAL: Add Itinerary ─────────────────────────────────────────── */}
      {showItineraryModal && (
        <ModalFrame
          className="trip-dialog fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClose={() => {
            setShowItineraryModal(false);
            setAddBudgetRows([]);
          }}
        >
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl w-full max-w-md p-4 sm:p-4 shadow-2xl space-y-4 my-4 sm:my-8">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
              <h3 className="text-lg font-bold">Tambah Jadwal Aktivitas</h3>
              <button
                type="button"
                onClick={() => {
                  setShowItineraryModal(false);
                  setAddBudgetRows([]);
                }}
                className="text-muted-foreground hover:text-foreground dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleItinerarySubmit} className="space-y-4">
              {(() => {
                const tripDays = tripDuration(trip.start_date, trip.end_date);
                return (
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1"
                      htmlFor="field-page-tripsid-8"
                    >
                      Hari ke berapa? *
                      {tripDays ? (
                        <span className="font-normal text-muted-foreground ml-1">
                          (maks. hari {tripDays})
                        </span>
                      ) : (
                        ""
                      )}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={tripDays}
                      required
                      placeholder={
                        tripDays ? `1 – ${tripDays}` : "Contoh: 1, 2, 3..."
                      }
                      value={itineraryForm.day_number}
                      onChange={(e) =>
                        setItineraryForm({
                          ...itineraryForm,
                          day_number: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                      id="field-page-tripsid-8"
                    />
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold mb-1"
                    htmlFor="field-page-tripsid-9"
                  >
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={itineraryForm.time_start}
                    onChange={(e) =>
                      setItineraryForm({
                        ...itineraryForm,
                        time_start: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="field-page-tripsid-9"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold mb-1"
                    htmlFor="field-page-tripsid-10"
                  >
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={itineraryForm.time_end}
                    onChange={(e) =>
                      setItineraryForm({
                        ...itineraryForm,
                        time_end: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="field-page-tripsid-10"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  htmlFor="field-page-tripsid-11"
                >
                  Nama Aktivitas / Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sarapan Gudeg & Menuju Candi Borobudur"
                  value={itineraryForm.title}
                  onChange={(e) =>
                    setItineraryForm({
                      ...itineraryForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted"
                  id="field-page-tripsid-11"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  htmlFor="field-page-tripsid-12"
                >
                  Lokasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Malioboro"
                  value={itineraryForm.location}
                  onChange={(e) =>
                    setItineraryForm({
                      ...itineraryForm,
                      location: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted"
                  id="field-page-tripsid-12"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  htmlFor="field-page-tripsid-13"
                >
                  Link Google Maps (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={itineraryForm.location_url}
                  onChange={(e) =>
                    setItineraryForm({
                      ...itineraryForm,
                      location_url: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted"
                  id="field-page-tripsid-13"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  htmlFor="field-page-tripsid-14"
                >
                  Catatan / Tips
                </label>
                <textarea
                  rows={2}
                  placeholder="Beli tiket online, pakai baju hangat, dll."
                  value={itineraryForm.notes}
                  onChange={(e) =>
                    setItineraryForm({
                      ...itineraryForm,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted"
                  id="field-page-tripsid-14"
                />
              </div>

              {/* ── Budget Aktivitas ── */}
              <div className="border-t border-border dark:border-border pt-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="block text-xs font-semibold">
                    Budget Aktivitas
                  </label>
                  {addBudgetRows.length > 0 && (
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                      Total: Rp{" "}
                      {addBudgetRows
                        .reduce((s, r) => s + (Number(r.amount) || 0), 0)
                        .toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
                {addBudgetRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Keterangan (contoh: Tiket masuk)"
                      value={row.label}
                      onChange={(e) => {
                        const next = [...addBudgetRows];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setAddBudgetRows(next);
                      }}
                      className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Nominal"
                      value={row.amount}
                      onChange={(e) => {
                        const next = [...addBudgetRows];
                        next[idx] = { ...next[idx], amount: e.target.value };
                        setAddBudgetRows(next);
                      }}
                      className="w-24 sm:w-32 px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAddBudgetRows(
                          addBudgetRows.filter((_, i) => i !== idx),
                        )
                      }
                      className="p-2 text-muted-foreground hover:text-rose-600 rounded-lg transition"
                      aria-label="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setAddBudgetRows([
                      ...addBudgetRows,
                      { label: "", amount: "" },
                    ])
                  }
                  className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-700 font-medium transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Budget
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border dark:border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowItineraryModal(false);
                    setAddBudgetRows([]);
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-muted dark:hover:bg-neutral-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addItinerary.isPending}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {addItinerary.isPending ? "Menyimpan..." : "Simpan Agenda"}
                </button>
              </div>
            </form>
          </div>
        </ModalFrame>
      )}

      {/* ─── MODAL: Edit Itinerary ────────────────────────────────────────── */}
      {editingItinerary && (
        <ModalFrame
          className="trip-dialog fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClose={() => setEditingItinerary(null)}
        >
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl w-full max-w-md p-4 sm:p-4 shadow-2xl space-y-4 my-4 sm:my-8">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
              <h3 className="text-lg font-bold">Edit Jadwal Aktivitas</h3>
              <button
                onClick={() => setEditingItinerary(null)}
                className="text-muted-foreground hover:text-foreground dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditItinerarySubmit} className="space-y-4">
              {(() => {
                const tripDays = tripDuration(trip.start_date, trip.end_date);
                return (
                  <div>
                    <label
                      className="block text-xs font-semibold mb-1"
                      htmlFor="field-page-tripsid-15"
                    >
                      Hari ke berapa? *
                      {tripDays ? (
                        <span className="font-normal text-muted-foreground ml-1">
                          (maks. hari {tripDays})
                        </span>
                      ) : (
                        ""
                      )}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={tripDays}
                      required
                      placeholder={
                        tripDays ? `1 – ${tripDays}` : "Contoh: 1, 2, 3..."
                      }
                      value={editItineraryForm.day_number}
                      onChange={(e) =>
                        setEditItineraryForm({
                          ...editItineraryForm,
                          day_number: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                      id="field-page-tripsid-15"
                    />
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-semibold mb-1"
                    htmlFor="field-page-tripsid-16"
                  >
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={editItineraryForm.time_start}
                    onChange={(e) =>
                      setEditItineraryForm({
                        ...editItineraryForm,
                        time_start: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="field-page-tripsid-16"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold mb-1"
                    htmlFor="field-page-tripsid-17"
                  >
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={editItineraryForm.time_end}
                    onChange={(e) =>
                      setEditItineraryForm({
                        ...editItineraryForm,
                        time_end: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="field-page-tripsid-17"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  htmlFor="field-page-tripsid-18"
                >
                  Nama Aktivitas / Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  value={editItineraryForm.title}
                  onChange={(e) =>
                    setEditItineraryForm({
                      ...editItineraryForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted"
                  id="field-page-tripsid-18"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  htmlFor="field-page-tripsid-19"
                >
                  Lokasi
                </label>
                <input
                  type="text"
                  value={editItineraryForm.location}
                  onChange={(e) =>
                    setEditItineraryForm({
                      ...editItineraryForm,
                      location: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted"
                  id="field-page-tripsid-19"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  htmlFor="field-page-tripsid-20"
                >
                  Link Google Maps (Opsional)
                </label>
                <input
                  type="url"
                  value={editItineraryForm.location_url}
                  onChange={(e) =>
                    setEditItineraryForm({
                      ...editItineraryForm,
                      location_url: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted"
                  id="field-page-tripsid-20"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  htmlFor="field-page-tripsid-21"
                >
                  Catatan / Tips
                </label>
                <textarea
                  rows={2}
                  value={editItineraryForm.notes}
                  onChange={(e) =>
                    setEditItineraryForm({
                      ...editItineraryForm,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted"
                  id="field-page-tripsid-21"
                />
              </div>

              {/* ── Budget Aktivitas ──────────────────────────── */}
              <div className="border-t border-border dark:border-border pt-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="block text-xs font-semibold">
                    Budget Aktivitas
                  </label>
                  {budgetRows.length > 0 && (
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                      Total: Rp{" "}
                      {budgetRows
                        .reduce((s, r) => s + (Number(r.amount) || 0), 0)
                        .toLocaleString("id-ID")}
                    </span>
                  )}
                </div>

                {budgetRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Keterangan (contoh: Tiket masuk)"
                      value={row.label}
                      onChange={(e) => {
                        const next = [...budgetRows];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setBudgetRows(next);
                      }}
                      className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Nominal"
                      value={row.amount}
                      onChange={(e) => {
                        const next = [...budgetRows];
                        next[idx] = { ...next[idx], amount: e.target.value };
                        setBudgetRows(next);
                      }}
                      className="w-24 sm:w-32 px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setBudgetRows(budgetRows.filter((_, i) => i !== idx))
                      }
                      className="p-2 text-muted-foreground hover:text-rose-600 rounded-lg transition"
                      aria-label="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setBudgetRows([...budgetRows, { label: "", amount: "" }])
                  }
                  className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-700 font-medium transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Budget
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border dark:border-border">
                <button
                  type="button"
                  onClick={() => setEditingItinerary(null)}
                  className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-muted dark:hover:bg-neutral-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updateItinerary.isPending}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {updateItinerary.isPending
                    ? "Menyimpan..."
                    : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </ModalFrame>
      )}

      {/* ─── MODAL: Add Packing Item ──────────────────────────────────────── */}
      {showPackingModal && (
        <ModalFrame
          className="trip-dialog fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClose={() => setShowPackingModal(false)}
        >
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl w-full max-w-md p-4 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Tambah Barang Bawaan</h3>
            <form onSubmit={handlePackingSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  htmlFor="field-page-tripsid-22"
                >
                  Nama Barang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Powerbank, Jaket Anak, Obat Alergi"
                  value={packingForm.item_name}
                  onChange={(e) =>
                    setPackingForm({
                      ...packingForm,
                      item_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted"
                  id="field-page-tripsid-22"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  htmlFor="field-page-tripsid-23"
                >
                  Kategori
                </label>
                <select
                  value={packingForm.category}
                  onChange={(e) =>
                    setPackingForm({ ...packingForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted"
                  id="field-page-tripsid-23"
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
                  <label
                    className="block text-xs font-semibold mb-1"
                    htmlFor="field-page-tripsid-24"
                  >
                    Penanggung Jawab (PIC)
                  </label>
                  <select
                    value={packingForm.assigned_to}
                    onChange={(e) =>
                      setPackingForm({
                        ...packingForm,
                        assigned_to: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted"
                    id="field-page-tripsid-24"
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

              <div className="flex justify-end gap-3 pt-3 border-t border-border dark:border-border">
                <button
                  type="button"
                  onClick={() => setShowPackingModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-muted dark:hover:bg-neutral-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addPacking.isPending}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </ModalFrame>
      )}

      {/* ─── MODAL: Upload Document / Ticket ──────────────────────────────── */}
      {showDocModal && (
        <ModalFrame
          className="trip-dialog fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClose={() => setShowDocModal(false)}
        >
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl w-full max-w-md p-4 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary-600" /> Upload
                E-Tiket / Voucher
              </h3>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-muted-foreground hover:text-foreground dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDocSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-tripsid-31"
                >
                  Pilih File Dokumen / Tiket (PDF, JPG, PNG) *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-neutral-800 dark:file:text-neutral-200"
                  id="field-page-tripsid-31"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-tripsid-32"
                >
                  Judul Dokumen (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tiket Kereta Argo Parahyangan, Voucher Villa"
                  value={docForm.title}
                  onChange={(e) =>
                    setDocForm({ ...docForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-tripsid-32"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-tripsid-33"
                >
                  Jenis Dokumen
                </label>
                <select
                  value={docForm.doc_type}
                  onChange={(e) =>
                    setDocForm({
                      ...docForm,
                      doc_type: e.target.value as
                        "ticket" | "hotel" | "insurance" | "visa" | "other",
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-tripsid-33"
                >
                  <option value="ticket">
                    Tiket Transport (Pesawat/Kereta/Bis)
                  </option>
                  <option value="hotel">Voucher Hotel / Villa</option>
                  <option value="insurance">Asuransi Perjalanan</option>
                  <option value="visa">Visa / Paspor</option>
                  <option value="other">Lainnya / Bukti Reservasi</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold text-foreground dark:text-foreground mb-1"
                  htmlFor="field-page-tripsid-34"
                >
                  Catatan / Kode Booking (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Kode booking: ABC123, Gate 4..."
                  value={docForm.notes}
                  onChange={(e) =>
                    setDocForm({ ...docForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-border bg-card dark:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="field-page-tripsid-34"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border dark:border-border">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted dark:hover:bg-neutral-800 text-foreground dark:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadDoc.isPending || !docFile}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {uploadDoc.isPending ? "Mengupload..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </ModalFrame>
      )}

      {/* ─── MODAL: Manage Trip Members ──────────────────────────────────── */}
      {showMemberModal && (
        <ModalFrame
          className="trip-dialog fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
          onClose={() => setShowMemberModal(false)}
        >
          <div className="bg-card dark:bg-card border border-border dark:border-border rounded-2xl w-full max-w-md p-4 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Kelola Anggota
                Liburan
              </h3>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-muted-foreground hover:text-foreground dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Pilih atau batalkan pilihan anggota keluarga yang ikut dalam
                perjalanan liburan ini:
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {members.map((m) => {
                  const isSelected = selectedMemberIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMemberSelection(m.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800"
                          : "bg-card dark:bg-muted/50 border-border dark:border-border hover:bg-muted dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs font-bold transition ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-neutral-300 dark:border-neutral-600"
                          }`}
                        >
                          {isSelected && "✓"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground dark:text-foreground">
                            {m.name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {m.role}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          isSelected
                            ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                            : "bg-muted dark:bg-neutral-700 text-muted-foreground"
                        }`}
                      >
                        {isSelected ? "Ikut" : "Tidak"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted dark:hover:bg-neutral-800 text-foreground dark:text-foreground"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveMembers}
                disabled={updateTrip.isPending}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
              >
                {updateTrip.isPending ? "Menyimpan..." : "Simpan Peserta"}
              </button>
            </div>
          </div>
        </ModalFrame>
      )}
    </div>
  );
}
