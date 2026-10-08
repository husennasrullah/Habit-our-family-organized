"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  Pencil,
  ChevronDown,
  ChevronUp,
  Receipt,
  FileText,
  UploadCloud,
  Download,
  Wallet,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useTrip,
  useUpdateTrip,
  useAddItinerary,
  useUpdateItinerary,
  useDeleteItinerary,
  useAddItineraryBudget,
  useDeleteItineraryBudget,
  useAddPackingItem,
  useTogglePackingItem,
  useDeletePackingItem,
  useAddTripExpense,
  useDeleteTripExpense,
  useUploadTripDocument,
  useDeleteTripDocument,
  tripKeys,
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

export default function TripDetailPage({ params }: { params?: { id?: string } }) {
  const routeParams = useParams();
  const id = (params?.id || routeParams?.id) as string;
  const queryClient = useQueryClient();
  const { data: trip, isLoading } = useTrip(id);
  const { data: members = [] } = useFamilyMembers();

  const updateTrip = useUpdateTrip();
  const addItinerary = useAddItinerary(id);
  const updateItinerary = useUpdateItinerary(id);
  const deleteItinerary = useDeleteItinerary(id);
  const addPacking = useAddPackingItem(id);
  const togglePacking = useTogglePackingItem(id);
  const deletePacking = useDeletePackingItem(id);
  const addExpense = useAddTripExpense(id);
  const deleteExpense = useDeleteTripExpense(id);
  const uploadDoc = useUploadTripDocument(id);
  const deleteDoc = useDeleteTripDocument(id);

  const [activeTab, setActiveTab] = useState<"itinerary" | "packing" | "expenses" | "documents" | "overview">("itinerary");
  const [expandedBudgets, setExpandedBudgets] = useState<Record<string, boolean>>({});

  const toggleBudgetExpand = (itineraryId: string) => {
    setExpandedBudgets((prev) => ({
      ...prev,
      [itineraryId]: !prev[itineraryId],
    }));
  };

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
  const [editingItinerary, setEditingItinerary] = useState<TripItinerary | null>(null);
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

  const addBudgetHook = useAddItineraryBudget(id, editingItinerary?.id ?? "");
  const deleteBudgetHook = useDeleteItineraryBudget(id, editingItinerary?.id ?? "");

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
      }))
    );
  };

  const handleEditItinerarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItinerary || !editItineraryForm.title) return;

    // 1. Update itinerary fields
    await updateItinerary.mutateAsync({
      itineraryId: editingItinerary.id,
      payload: {
        day_number: Number(editItineraryForm.day_number),
        time_start: editItineraryForm.time_start,
        time_end: editItineraryForm.time_end,
        title: editItineraryForm.title,
        location: editItineraryForm.location,
        location_url: editItineraryForm.location_url,
        notes: editItineraryForm.notes,
      },
    });

    // 2. Hapus budget items yang sudah dihapus dari rows
    const existingItems = editingItinerary.budget_items ?? [];
    const existingIds = existingItems.map((b) => b.id);
    const keptIds = budgetRows.filter((r) => r.id).map((r) => r.id!);
    const toDelete = existingIds.filter((eid) => !keptIds.includes(eid));
    for (const bid of toDelete) {
      await deleteBudgetHook.mutateAsync(bid);
    }

    // 3. Update budget items yang sudah ada tapi nilainya berubah (delete + re-add)
    for (const row of budgetRows) {
      if (row.id) {
        const original = existingItems.find((b) => b.id === row.id);
        const labelChanged = original && original.label !== row.label.trim();
        const amountChanged = original && original.amount !== Number(row.amount);
        if ((labelChanged || amountChanged) && row.label.trim() && Number(row.amount) > 0) {
          await deleteBudgetHook.mutateAsync(row.id);
          await addBudgetHook.mutateAsync({
            label: row.label.trim(),
            amount: Number(row.amount),
          });
        }
      }
    }

    // 4. Tambah budget items baru (yang belum punya id)
    for (const row of budgetRows) {
      if (!row.id && row.label.trim() && Number(row.amount) > 0) {
        await addBudgetHook.mutateAsync({
          label: row.label.trim(),
          amount: Number(row.amount),
        });
      }
    }

    setEditingItinerary(null);
  };

  // ── Packing modal ──────────────────────────────────────────────────────────
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [packingForm, setPackingForm] = useState({
    item_name: "",
    category: "Pakaian",
    assigned_to: "",
  });

  // ── Expense modal ──────────────────────────────────────────────────────────
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "Kuliner",
    date: new Date().toISOString().slice(0, 10),
    paid_by: "",
    notes: "",
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
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSaveMembers = async () => {
    if (!trip) return;
    await updateTrip.mutateAsync({
      id,
      payload: {
        member_ids: selectedMemberIds,
      },
    });
    setShowMemberModal(false);
  };

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

    const newItem = await addItinerary.mutateAsync({
      day_number: Number(itineraryForm.day_number),
      time_start: itineraryForm.time_start,
      time_end: itineraryForm.time_end,
      title: itineraryForm.title,
      location: itineraryForm.location,
      location_url: itineraryForm.location_url,
      notes: itineraryForm.notes,
    });

    // Simpan budget rows ke itinerary yang baru dibuat
    if (newItem) {
      for (const row of addBudgetRows) {
        if (row.label.trim() && Number(row.amount) > 0) {
          await api.post(`/trips/${id}/itineraries/${newItem.id}/budgets`, {
            label: row.label.trim(),
            amount: Number(row.amount),
          });
        }
      }
      // Invalidate agar budget_items ikut ter-load
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
    }

    setShowItineraryModal(false);
    setItineraryForm({ day_number: 1, time_start: "09:00", time_end: "11:00", title: "", location: "", location_url: "", notes: "" });
    setAddBudgetRows([]);
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

  const totalItineraryBudget = itineraries.reduce(
    (sum, item) => sum + (item.budget_items ?? []).reduce((s, b) => s + b.amount, 0),
    0
  );

  const expenses = trip.expenses ?? [];
  const documents = trip.documents ?? [];

  const totalActualExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const budgetEstimate = trip.budget_estimate || 0;
  const expensePercentage = budgetEstimate > 0 ? Math.min(Math.round((totalActualExpense / budgetEstimate) * 100), 100) : 0;
  const isOverBudget = budgetEstimate > 0 && totalActualExpense > budgetEstimate;

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return;

    await addExpense.mutateAsync({
      title: expenseForm.title,
      amount: Number(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date,
      paid_by: expenseForm.paid_by || null,
      notes: expenseForm.notes,
    });

    setShowExpenseModal(false);
    setExpenseForm({
      title: "",
      amount: "",
      category: "Kuliner",
      date: new Date().toISOString().slice(0, 10),
      paid_by: "",
      notes: "",
    });
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;

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
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={openMemberModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <Users className="w-4 h-4 text-indigo-600" /> Anggota ({trip.members?.length ?? 0})
          </button>
          <button
            onClick={openEditTripModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <Pencil className="w-4 h-4" /> Edit Liburan
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-neutral-900 min-h-[220px] shadow-lg flex flex-col justify-end">
        {trip.cover_image_url && (
          <img
            src={trip.cover_image_url}
            alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}
        {/* gradient overlay supaya teks selalu terbaca */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 space-y-2 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white">
              <MapPin className="w-3 h-3 text-rose-300" /> {trip.destination}
            </span>
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white">
              <Calendar className="w-3 h-3 text-blue-300" />
              {trip.start_date ? new Date(trip.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"} -{" "}
              {trip.end_date ? new Date(trip.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-md">{trip.title}</h1>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab("itinerary")}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
            activeTab === "itinerary"
              ? "bg-blue-600 text-white shadow"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
              ? "bg-blue-600 text-white shadow"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Luggage className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Packing ({packedCount}/{packingItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
            activeTab === "expenses"
              ? "bg-blue-600 text-white shadow"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Pengeluaran ({expenses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 ${
            activeTab === "documents"
              ? "bg-blue-600 text-white shadow"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
              ? "bg-blue-600 text-white shadow"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Info</span>
          <span className="hidden sm:inline">& Catatan</span>
        </button>
      </div>

      {/* ─── TAB 1: ITINERARY ────────────────────────────────────────────── */}
      {activeTab === "itinerary" && (
        <div className="space-y-4">
          {/* Header + budget summary bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">
                {itineraries.length} aktivitas
                {totalItineraryBudget > 0 && (
                  <span className="ml-2 font-semibold text-neutral-700 dark:text-neutral-300">
                    · Estimasi Rp {totalItineraryBudget.toLocaleString("id-ID")}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowItineraryModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" /> Tambah Aktivitas
            </button>
          </div>

          {/* Budget vs estimasi trip */}
          {totalItineraryBudget > 0 && trip.budget_estimate > 0 && (
            <div className="px-4 py-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Alokasi Rencana Aktivitas vs Total Budget
                </span>
                <span className={`font-bold ${totalItineraryBudget > trip.budget_estimate ? "text-rose-600" : "text-emerald-600"}`}>
                  {Math.round((totalItineraryBudget / trip.budget_estimate) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${totalItineraryBudget > trip.budget_estimate ? "bg-rose-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min((totalItineraryBudget / trip.budget_estimate) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-0.5">
                <span>
                  Rencana aktivitas: <b>Rp {totalItineraryBudget.toLocaleString("id-ID")}</b> dari total budget <b>Rp {trip.budget_estimate.toLocaleString("id-ID")}</b>
                </span>
                <span>
                  {totalItineraryBudget > trip.budget_estimate ? (
                    <span className="text-rose-600 font-semibold">
                      Melebihi Rp {(totalItineraryBudget - trip.budget_estimate).toLocaleString("id-ID")}
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">
                      Sisa Rp {(trip.budget_estimate - totalItineraryBudget).toLocaleString("id-ID")}
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {itineraries.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-6">
              <Clock className="w-10 h-10 mx-auto mb-2 text-neutral-400" />
              <h3 className="font-semibold text-sm">Belum ada agenda perjalanan</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4">Tambahkan jadwal kegiatan seru untuk hari pertama dan seterusnya.</p>
              <button onClick={() => setShowItineraryModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold">
                + Tambah Agenda
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDayNumbers.map((dayNum) => {
                const dayItems = daysMap[dayNum].slice().sort((a, b) =>
                  (a.time_start ?? "").localeCompare(b.time_start ?? "")
                );
                const dayBudget = dayItems.reduce(
                  (s, item) => s + (item.budget_items ?? []).reduce((ss, b) => ss + b.amount, 0), 0
                );
                return (
                  <div key={dayNum} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
                    {/* Day header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          H{dayNum}
                        </span>
                        <span className="font-bold text-sm">Hari ke-{dayNum}</span>
                        {trip.start_date && (() => {
                          const d = new Date(trip.start_date);
                          d.setDate(d.getDate() + dayNum - 1);
                          return (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                              {d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          );
                        })()}
                        <span className="text-xs text-neutral-400">{dayItems.length} aktivitas</span>
                      </div>
                      {dayBudget > 0 && (
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                          Rp {dayBudget.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="px-4 py-3">
                      {dayItems.map((item, idx) => {
                        const itemBudget = (item.budget_items ?? []).reduce((s, b) => s + b.amount, 0);
                        const isLast = idx === dayItems.length - 1;
                        return (
                          <div key={item.id} className="flex gap-3 group">
                            {/* Waktu + garis vertikal */}
                            <div className="flex flex-col items-center w-14 shrink-0">
                              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums leading-none pt-0.5">
                                {item.time_start || "—"}
                              </span>
                              <div className="w-px flex-1 bg-neutral-200 dark:bg-neutral-700 mt-1.5 mb-0" style={{ minHeight: isLast ? 0 : 32 }} />
                            </div>

                            {/* Dot */}
                            <div className="flex flex-col items-center shrink-0 mt-0.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-neutral-900 shrink-0" />
                            </div>

                            {/* Konten item */}
                            <div className={`flex-1 pb-4 ${isLast ? "" : ""}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 leading-snug">{item.title}</p>

                                  {item.location && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{item.location}</span>
                                      {item.location_url && (
                                        <a href={item.location_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 shrink-0">
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  )}

                                  {item.notes && (
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 line-clamp-2">{item.notes}</p>
                                  )}

                                  {/* Rincian Budget per item (Collapsible/Dropdown) */}
                                  {item.budget_items && item.budget_items.length > 0 && (
                                    <div className="mt-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 overflow-hidden transition-all">
                                      <button
                                        type="button"
                                        onClick={() => toggleBudgetExpand(item.id)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-neutral-100/60 dark:hover:bg-neutral-800/80 transition"
                                      >
                                        <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                                          <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                          <span>Estimasi Biaya</span>
                                          <span className="text-[11px] text-neutral-400 font-normal">
                                            ({item.budget_items.length} item)
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                          <span>Rp {itemBudget.toLocaleString("id-ID")}</span>
                                          {expandedBudgets[item.id] ? (
                                            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                                          ) : (
                                            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                                          )}
                                        </div>
                                      </button>

                                      {expandedBudgets[item.id] && (
                                        <div className="px-3 pb-2.5 pt-1 border-t border-neutral-200/50 dark:border-neutral-700/50 space-y-1.5 bg-white/40 dark:bg-neutral-900/40">
                                          {item.budget_items.map((b) => (
                                            <div key={b.id} className="flex items-center justify-between text-xs py-0.5">
                                              <span className="text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                {b.label}
                                              </span>
                                              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                                Rp {b.amount.toLocaleString("id-ID")}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Aksi */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                                  <button
                                    onClick={() => openEditItineraryModal(item)}
                                    className="p-1.5 text-neutral-400 hover:text-blue-600 rounded-lg transition"
                                    title="Edit"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteItinerary.mutate(item.id)}
                                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Waktu selesai jika ada */}
                              {item.time_end && (
                                <div className="flex items-center gap-1 mt-1">
                                  <div className="w-14 shrink-0 -ml-[4.25rem] text-right pr-3">
                                    <span className="text-xs text-neutral-400 tabular-nums">{item.time_end}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" /> Peserta Liburan
                </h3>
                <button
                  onClick={openMemberModal}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg transition"
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

      {/* ─── TAB 4: EXPENSES & SPLIT BILL ─────────────────────────────────── */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
                <span>Total Pengeluaran Riil</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                Rp {totalActualExpense.toLocaleString("id-ID")}
              </p>
              <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverBudget ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${expensePercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
                <span>Estimasi Budget Liburan</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                Rp {budgetEstimate.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                {isOverBudget ? (
                  <span className="text-rose-600 font-semibold">
                    Over-budget Rp {(totalActualExpense - budgetEstimate).toLocaleString("id-ID")}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold">
                    Sisa Rp {(budgetEstimate - totalActualExpense).toLocaleString("id-ID")}
                  </span>
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-2">
                <span>Catat Pengeluaran Baru</span>
                <Receipt className="w-4 h-4 text-indigo-600" />
              </div>
              <button
                onClick={() => {
                  setExpenseForm({
                    title: "",
                    amount: "",
                    category: "Kuliner",
                    date: new Date().toISOString().slice(0, 10),
                    paid_by: trip.members?.[0]?.id || "",
                    notes: "",
                  });
                  setShowExpenseModal(true);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" /> Tambah Pengeluaran
              </button>
            </div>
          </div>

          {/* Expenses List */}
          {expenses.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-6">
              <Receipt className="w-10 h-10 mx-auto mb-2 text-neutral-400" />
              <h3 className="font-semibold text-sm">Belum ada catatan pengeluaran</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4">Catat biaya makan, transportasi, tiket, atau hotel selama liburan.</p>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                + Tambah Pengeluaran
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                          {exp.category}
                        </span>
                        <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100">{exp.title}</h4>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {exp.date ? new Date(exp.date).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-"} • Dibayar oleh:{" "}
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          {exp.payer?.name ?? "Tidak diset"}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3">
                      <span className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
                        Rp {exp.amount.toLocaleString("id-ID")}
                      </span>
                      <button
                        onClick={() => deleteExpense.mutate(exp.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1.5 rounded-lg transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {exp.notes && (
                    <p className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl">
                      💬 {exp.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: DOCUMENTS & TICKETS ──────────────────────────────────── */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold">Dokumen & E-Tiket Perjalanan</h2>
              <p className="text-xs text-neutral-500">
                Simpan tiket penerbangan, kereta, voucher hotel, atau dokumen asuransi agar mudah diakses.
              </p>
            </div>
            <button
              onClick={() => setShowDocModal(true)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              <UploadCloud className="w-4 h-4" /> Upload Dokumen / Tiket
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-6">
              <FileText className="w-10 h-10 mx-auto mb-2 text-neutral-400" />
              <h3 className="font-semibold text-sm">Belum ada dokumen yang diunggah</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-4">Unggah tiket penerbangan, booking hotel, voucher wisata di sini.</p>
              <button
                onClick={() => setShowDocModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                + Upload Dokumen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => {
                const typeLabels: Record<string, { label: string; color: string }> = {
                  ticket: { label: "Tiket Transport", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
                  hotel: { label: "Voucher Hotel", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
                  insurance: { label: "Asuransi", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
                  visa: { label: "Visa / Paspor", color: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300" },
                  other: { label: "Lainnya", color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300" },
                };
                const badge = typeLabels[doc.doc_type] || typeLabels.other;

                return (
                  <div
                    key={doc.id}
                    className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                        <button
                          onClick={() => deleteDoc.mutate(doc.id)}
                          className="text-neutral-400 hover:text-rose-600 p-1 rounded-lg transition"
                          title="Hapus Dokumen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">{doc.title}</h4>
                      <p className="text-xs text-neutral-500 truncate">{doc.file_name}</p>

                      {doc.notes && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-lg">
                          {doc.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                      <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                      <a
                        href={`http://localhost:8080/storage/${doc.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download / Buka
                      </a>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" /> Edit Rencana Liburan
              </h3>
              <button
                onClick={() => setShowEditTripModal(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditTripSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nama Rencana Liburan *
                </label>
                <input
                  type="text"
                  required
                  value={editTripForm.title}
                  onChange={(e) => setEditTripForm({ ...editTripForm, title: e.target.value })}
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
                  value={editTripForm.destination}
                  onChange={(e) => setEditTripForm({ ...editTripForm, destination: e.target.value })}
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
                    value={editTripForm.start_date}
                    onChange={(e) => setEditTripForm({ ...editTripForm, start_date: e.target.value })}
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
                    value={editTripForm.end_date}
                    onChange={(e) => setEditTripForm({ ...editTripForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editTripForm.status}
                    onChange={(e) => setEditTripForm({ ...editTripForm, status: e.target.value as TripStatus })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Estimasi Budget (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editTripForm.budget_estimate || ""}
                    onChange={(e) => setEditTripForm({ ...editTripForm, budget_estimate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  URL Foto Sampul (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editTripForm.cover_image_url}
                  onChange={(e) => setEditTripForm({ ...editTripForm, cover_image_url: e.target.value })}
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
                      const selected = editTripForm.member_ids.includes(m.id);
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => handleEditTripMemberToggle(m.id)}
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
                  value={editTripForm.notes}
                  onChange={(e) => setEditTripForm({ ...editTripForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowEditTripModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updateTrip.isPending}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {updateTrip.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Itinerary ─────────────────────────────────────────── */}
      {showItineraryModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl space-y-4 my-4 sm:my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-bold">Tambah Jadwal Aktivitas</h3>
              <button type="button" onClick={() => { setShowItineraryModal(false); setAddBudgetRows([]); }} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">✕</button>
            </div>
            <form onSubmit={handleItinerarySubmit} className="space-y-4">
              {(() => {
                const tripDays = trip?.start_date && trip?.end_date
                  ? Math.max(1, Math.round((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000) + 1)
                  : undefined;
                return (
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Hari ke berapa? *{tripDays ? <span className="font-normal text-neutral-500 ml-1">(maks. hari {tripDays})</span> : ""}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={tripDays}
                      required
                      placeholder={tripDays ? `1 – ${tripDays}` : "Contoh: 1, 2, 3..."}
                      value={itineraryForm.day_number}
                      onChange={(e) => setItineraryForm({ ...itineraryForm, day_number: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Jam Mulai</label>
                  <input type="time" value={itineraryForm.time_start} onChange={(e) => setItineraryForm({ ...itineraryForm, time_start: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Jam Selesai</label>
                  <input type="time" value={itineraryForm.time_end} onChange={(e) => setItineraryForm({ ...itineraryForm, time_end: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Nama Aktivitas / Kegiatan *</label>
                <input type="text" required placeholder="Contoh: Sarapan Gudeg & Menuju Candi Borobudur" value={itineraryForm.title} onChange={(e) => setItineraryForm({ ...itineraryForm, title: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Lokasi</label>
                <input type="text" placeholder="Contoh: Jl. Malioboro" value={itineraryForm.location} onChange={(e) => setItineraryForm({ ...itineraryForm, location: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Link Google Maps (Opsional)</label>
                <input type="url" placeholder="https://maps.google.com/..." value={itineraryForm.location_url} onChange={(e) => setItineraryForm({ ...itineraryForm, location_url: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Catatan / Tips</label>
                <textarea rows={2} placeholder="Beli tiket online, pakai baju hangat, dll." value={itineraryForm.notes} onChange={(e) => setItineraryForm({ ...itineraryForm, notes: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800" />
              </div>

              {/* ── Budget Aktivitas ── */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold">Budget Aktivitas</label>
                  {addBudgetRows.length > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      Total: Rp {addBudgetRows.reduce((s, r) => s + (Number(r.amount) || 0), 0).toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
                {addBudgetRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Keterangan (contoh: Tiket masuk)"
                      value={row.label}
                      onChange={(e) => { const next = [...addBudgetRows]; next[idx] = { ...next[idx], label: e.target.value }; setAddBudgetRows(next); }}
                      className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Nominal"
                      value={row.amount}
                      onChange={(e) => { const next = [...addBudgetRows]; next[idx] = { ...next[idx], amount: e.target.value }; setAddBudgetRows(next); }}
                      className="w-24 sm:w-32 px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button type="button" onClick={() => setAddBudgetRows(addBudgetRows.filter((_, i) => i !== idx))} className="p-2 text-neutral-400 hover:text-rose-600 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setAddBudgetRows([...addBudgetRows, { label: "", amount: "" }])} className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium transition">
                  <Plus className="w-3.5 h-3.5" /> Tambah Budget
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button type="button" onClick={() => { setShowItineraryModal(false); setAddBudgetRows([]); }} className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  Batal
                </button>
                <button type="submit" disabled={addItinerary.isPending} className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50">
                  {addItinerary.isPending ? "Menyimpan..." : "Simpan Agenda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Edit Itinerary ────────────────────────────────────────── */}
      {editingItinerary && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-2xl space-y-4 my-4 sm:my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-bold">Edit Jadwal Aktivitas</h3>
              <button
                onClick={() => setEditingItinerary(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditItinerarySubmit} className="space-y-4">
              {(() => {
                const tripDays = trip?.start_date && trip?.end_date
                  ? Math.max(1, Math.round((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000) + 1)
                  : undefined;
                return (
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Hari ke berapa? *{tripDays ? <span className="font-normal text-neutral-500 ml-1">(maks. hari {tripDays})</span> : ""}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={tripDays}
                      required
                      placeholder={tripDays ? `1 – ${tripDays}` : "Contoh: 1, 2, 3..."}
                      value={editItineraryForm.day_number}
                      onChange={(e) => setEditItineraryForm({ ...editItineraryForm, day_number: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={editItineraryForm.time_start}
                    onChange={(e) => setEditItineraryForm({ ...editItineraryForm, time_start: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={editItineraryForm.time_end}
                    onChange={(e) => setEditItineraryForm({ ...editItineraryForm, time_end: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Nama Aktivitas / Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={editItineraryForm.title}
                  onChange={(e) => setEditItineraryForm({ ...editItineraryForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Lokasi</label>
                <input
                  type="text"
                  value={editItineraryForm.location}
                  onChange={(e) => setEditItineraryForm({ ...editItineraryForm, location: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Link Google Maps (Opsional)</label>
                <input
                  type="url"
                  value={editItineraryForm.location_url}
                  onChange={(e) => setEditItineraryForm({ ...editItineraryForm, location_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Catatan / Tips</label>
                <textarea
                  rows={2}
                  value={editItineraryForm.notes}
                  onChange={(e) => setEditItineraryForm({ ...editItineraryForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
              </div>

              {/* ── Budget Aktivitas ──────────────────────────── */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold">Budget Aktivitas</label>
                  {budgetRows.length > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      Total: Rp {budgetRows.reduce((s, r) => s + (Number(r.amount) || 0), 0).toLocaleString("id-ID")}
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
                      className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                      className="w-24 sm:w-32 px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setBudgetRows(budgetRows.filter((_, i) => i !== idx))}
                      className="p-2 text-neutral-400 hover:text-rose-600 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setBudgetRows([...budgetRows, { label: "", amount: "" }])}
                  className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Budget
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingItinerary(null)}
                  className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updateItinerary.isPending || addBudgetHook.isPending || deleteBudgetHook.isPending}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {updateItinerary.isPending || addBudgetHook.isPending || deleteBudgetHook.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Packing Item ──────────────────────────────────────── */}
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

      {/* ─── MODAL: Add Expense & Split Bill ──────────────────────────────── */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" /> Catat Pengeluaran Liburan
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nama / Keperluan Pengeluaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Makan Siang di Resto Sunda, Bensin & Tol, Tiket Masuk"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Nominal (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Contoh: 150000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Kuliner">Kuliner & Makan</option>
                    <option value="Transportasi">Transportasi / BBM / Tol</option>
                    <option value="Penginapan">Penginapan & Hotel</option>
                    <option value="Tiket/Wisata">Tiket & Wisata</option>
                    <option value="Belanja/Oleh-oleh">Belanja / Oleh-oleh</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Ditalangi / Dibayar Oleh
                  </label>
                  <select
                    value={expenseForm.paid_by}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paid_by: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Pilih yang Membayar --</option>
                    {(trip.members ?? []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan tambahan..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addExpense.isPending}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {addExpense.isPending ? "Menyimpan..." : "Simpan Pengeluaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Upload Document / Ticket ──────────────────────────────── */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" /> Upload E-Tiket / Voucher
              </h3>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDocSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Pilih File Dokumen / Tiket (PDF, JPG, PNG) *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-neutral-800 dark:file:text-neutral-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Judul Dokumen (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tiket Kereta Argo Parahyangan, Voucher Villa"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Jenis Dokumen
                </label>
                <select
                  value={docForm.doc_type}
                  onChange={(e) =>
                    setDocForm({
                      ...docForm,
                      doc_type: e.target.value as "ticket" | "hotel" | "insurance" | "visa" | "other",
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ticket">Tiket Transport (Pesawat/Kereta/Bis)</option>
                  <option value="hotel">Voucher Hotel / Villa</option>
                  <option value="insurance">Asuransi Perjalanan</option>
                  <option value="visa">Visa / Paspor</option>
                  <option value="other">Lainnya / Bukti Reservasi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Catatan / Kode Booking (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Kode booking: ABC123, Gate 4..."
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadDoc.isPending || !docFile}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {uploadDoc.isPending ? "Mengupload..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Manage Trip Members ──────────────────────────────────── */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Kelola Anggota Liburan
              </h3>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-neutral-500">
                Pilih atau batalkan pilihan anggota keluarga yang ikut dalam perjalanan liburan ini:
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
                          : "bg-white dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
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
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{m.name}</p>
                          <p className="text-xs text-neutral-500 capitalize">{m.role}</p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          isSelected
                            ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                            : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                        }`}
                      >
                        {isSelected ? "Ikut" : "Tidak"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveMembers}
                disabled={updateTrip.isPending}
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {updateTrip.isPending ? "Menyimpan..." : "Simpan Peserta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
