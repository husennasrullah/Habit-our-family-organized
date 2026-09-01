"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { EventModal, type EventFormValues } from "@/components/calendar/EventModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  eventKeys,
} from "@/hooks/useEvents";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getApiDateRange, type CalendarView } from "@/lib/calendarUtils";
import type { CalendarEvent } from "@/types";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView]               = useState<CalendarView>("month");
  const [modalOpen, setModalOpen]     = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [initialDate, setInitialDate] = useState<Date | undefined>();

  const queryClient = useQueryClient();

  // ─── Date range for API ─────────────────────────────────────────────────────
  const { from, to } = getApiDateRange(currentDate, view);

  // ─── Data fetching ──────────────────────────────────────────────────────────
  const { data: events = [], isLoading } = useEvents(from, to);
  const createEvent  = useCreateEvent();
  const updateEvent  = useUpdateEvent();
  const deleteEvent  = useDeleteEvent();

  // ─── WebSocket real-time sync ───────────────────────────────────────────────
  useWebSocket({
    onMessage: (msg) => {
      if (["event_created", "event_updated", "event_deleted"].includes(msg.type)) {
        queryClient.invalidateQueries({ queryKey: eventKeys.all });
      }
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleAddEvent = useCallback((date?: Date) => {
    setSelectedEvent(null);
    setInitialDate(date ?? currentDate);
    setModalOpen(true);
  }, [currentDate]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
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
    if (!selectedEvent) return;
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
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onAddEvent={() => handleAddEvent()}
        onToday={() => setCurrentDate(new Date())}
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-[480px] w-full rounded-xl" />
        </div>
      ) : (
        <>
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onDayClick={(day) => {
                setCurrentDate(day);
                setView("day");
              }}
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
