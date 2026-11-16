"use client";

import Link from "next/link";
import { X, ExternalLink } from "lucide-react";
import { ModalFrame } from "@/components/shared/ModalFrame";
import { useAuthStore } from "@/stores/authStore";
import { useCalendarContext } from "@/hooks/useCalendarContext";
import {
  CALENDAR_SOURCES,
  AGENDA_SOURCES,
  sourceLabel,
} from "@/lib/calendarSources";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryError } from "@/components/shared/QueryError";
import { useState, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import {
  EventModal,
  type EventFormValues,
} from "@/components/calendar/EventModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  eventKeys,
} from "@/hooks/useEvents";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  getApiDateRange,
  calendarNow,
  type CalendarView,
} from "@/lib/calendarUtils";
import type { CalendarEvent } from "@/types";

export default function CalendarPage() {
  const context = useCalendarContext();
  const role = useAuthStore((s) => s.user?.role);
  const adult = role === "admin" || role === "member";
  const [sources, setSources] = useState<string[]>(AGENDA_SOURCES);
  const [linked, setLinked] = useState<CalendarEvent | null>(null);
  const opened = useRef("");
  const [currentDate, setCurrentDate] = useState(calendarNow);
  const [view, setView] = useState<CalendarView>("month");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [initialDate, setInitialDate] = useState<Date | undefined>();

  const queryClient = useQueryClient();

  // ─── Date range for API ─────────────────────────────────────────────────────
  const { from, to } = getApiDateRange(currentDate, view);

  // ─── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: allEvents = [],
    isLoading,
    isError,
    refetch,
  } = useEvents(from, to, true);
  const events = allEvents.filter((e) => sources.includes(e.source || "event"));
  useEffect(() => {
    if (context.date) {
      setCurrentDate(new Date(context.date + "T12:00:00"));
      setView("day");
    }
    if (context.sources) {
      const chosen = context.sources
        .split(",")
        .filter((s) => CALENDAR_SOURCES.some((c) => c.id === s));
      if (chosen.length) setSources(chosen);
    }
  }, [context.date, context.sources]);
  useEffect(() => {
    if (context.event && opened.current !== context.event) {
      const item = allEvents.find((e) => e.id === context.event);
      if (item) {
        opened.current = context.event;
        if (item.read_only) setLinked(item);
        else {
          setSelectedEvent(item);
          setModalOpen(true);
        }
      }
    }
  }, [context.event, allEvents]);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  // ─── WebSocket real-time sync ───────────────────────────────────────────────
  useWebSocket({
    onMessage: (msg) => {
      if (
        ["event_created", "event_updated", "event_deleted"].includes(msg.type)
      ) {
        queryClient.invalidateQueries({ queryKey: eventKeys.all });
      }
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleAddEvent = useCallback(
    (date?: Date) => {
      setSelectedEvent(null);
      setInitialDate(date ?? currentDate);
      setModalOpen(true);
    },
    [currentDate],
  );

  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (event.read_only) {
      setLinked(event);
      return;
    }
    setSelectedEvent(event);
    setInitialDate(undefined);
    setModalOpen(true);
  }, []);

  const handleSave = async (values: EventFormValues) => {
    try {
      if (selectedEvent) {
        await updateEvent.mutateAsync({ id: selectedEvent.id, ...values });
        toast.success("Event berhasil diperbarui");
      } else {
        await createEvent.mutateAsync(values);
        toast.success("Event berhasil dibuat");
      }
      setModalOpen(false);
    } catch {
      toast.error("Gagal menyimpan event");
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || !window.confirm("Hapus agenda ini?")) return;
    try {
      await deleteEvent.mutateAsync(selectedEvent.id);
      toast.success("Event berhasil dihapus");
      setModalOpen(false);
    } catch {
      toast.error("Gagal menghapus event");
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="calendar-page w-full min-w-0 space-y-4">
      <PageHeader
        title="Kalender"
        description="Waktu untuk yang penting. Atur agenda keluarga bersama."
      />
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onAddEvent={() => handleAddEvent()}
        onToday={() => setCurrentDate(calendarNow())}
      />

      <section className="calendar-source-panel" aria-label="Sumber kalender">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">
              Semua tanggal, satu tempat
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Terhubung otomatis. Ubah jadwal melalui menu asalnya. Tanggal dan
              waktu mengikuti WIB.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="calendar-source-preset"
              onClick={() => setSources(AGENDA_SOURCES)}
            >
              Agenda utama
            </button>
            <button
              className="calendar-source-preset"
              onClick={() =>
                setSources(
                  CALENDAR_SOURCES.filter((s) => adult || !s.adult).map(
                    (s) => s.id,
                  ),
                )
              }
            >
              Semua tanggal
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CALENDAR_SOURCES.filter((s) => adult || !s.adult).map((source) => (
            <button
              key={source.id}
              className={`calendar-source-chip ${sources.includes(source.id) ? "is-active" : ""}`}
              aria-pressed={sources.includes(source.id)}
              onClick={() =>
                setSources((current) =>
                  current.includes(source.id)
                    ? current.filter((s) => s !== source.id)
                    : [...current, source.id],
                )
              }
            >
              {source.label}
              <span className="ml-1 opacity-70">
                {
                  allEvents.filter((e) => (e.source || "event") === source.id)
                    .length
                }
              </span>
            </button>
          ))}
        </div>
        {!sources.length && (
          <p className="mt-3 text-xs text-muted-foreground">
            Pilih sumber tanggal untuk menampilkan isinya.
          </p>
        )}
      </section>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-[480px] w-full rounded-xl" />
        </div>
      ) : isError ? (
        <QueryError retry={() => void refetch()} />
      ) : (
        <>
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onDayClick={setCurrentDate}
              onAddEvent={handleAddEvent}
              onOpenDay={() => setView("day")}
              onEventClick={handleEventClick}
            />
          )}
          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onSlotClick={(date) => handleAddEvent(date)}
            />
          )}
          {view === "day" && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onSlotClick={(date) => handleAddEvent(date)}
            />
          )}
        </>
      )}

      {linked && (
        <ModalFrame
          onClose={() => setLinked(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <section className="max-h-[85dvh] w-full max-w-[360px] space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-primary-700">
                  {sourceLabel(linked)}
                </p>
                <h2 className="mt-1 text-base font-semibold">{linked.title}</h2>
              </div>
              <button
                aria-label="Tutup detail agenda"
                onClick={() => setLinked(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {linked.start_at.slice(0, 10).split("-").reverse().join(" / ")}
              {linked.end_at.slice(0, 10) !== linked.start_at.slice(0, 10)
                ? ` – ${linked.end_at.slice(0, 10).split("-").reverse().join(" / ")}`
                : ""}
              {!linked.is_all_day
                ? ` · ${linked.start_at.slice(11, 16)}–${linked.end_at.slice(11, 16)} WIB`
                : " · Sepanjang hari"}
            </p>
            {linked.description && (
              <p className="whitespace-pre-wrap break-words text-sm">
                {linked.description}
              </p>
            )}
            {linked.source_status && (
              <p className="text-xs text-muted-foreground">
                Status:{" "}
                {(
                  {
                    pending: "Belum selesai",
                    in_progress: "Sedang dikerjakan",
                    done: "Selesai",
                    given: "Sudah diberikan",
                    scheduled: "Terjadwal",
                    overdue: "Terlambat",
                    planning: "Direncanakan",
                    ongoing: "Berlangsung",
                    completed: "Selesai",
                    breakfast: "Sarapan",
                    lunch: "Makan siang",
                    dinner: "Makan malam",
                  } as Record<string, string>
                )[linked.source_status] ?? linked.source_status}
              </p>
            )}
            <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              Agenda ini mengikuti data dari menu {sourceLabel(linked)}.
              Perubahan dan penghapusan dilakukan di sana.
            </p>
            {linked.source_url && (
              <Link
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-3 text-sm font-semibold text-white"
                href={linked.source_url}
              >
                <ExternalLink size={15} />
                Buka menu asal
              </Link>
            )}
          </section>
        </ModalFrame>
      )}
      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={selectedEvent ? handleDelete : undefined}
        event={selectedEvent}
        initialDate={initialDate}
        isSaving={createEvent.isPending || updateEvent.isPending}
        isDeleting={deleteEvent.isPending}
      />
    </div>
  );
}
