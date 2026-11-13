"use client";
import { useState } from "react";
import {
  Clock,
  MapPin,
  ExternalLink,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/finance";
import { dayDate, itineraryOverlaps, sortedItineraries } from "@/lib/trips";
import type { Trip, TripItinerary } from "@/types";

export function ItineraryBoard({
  trip,
  onAdd,
  onEdit,
  onDelete,
  deleting,
}: {
  trip: Trip;
  onAdd: (day?: number) => void;
  onEdit: (item: TripItinerary) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const items = sortedItineraries(trip.itineraries ?? []),
    overlaps = itineraryOverlaps(items);
  const days = Array.from(new Set(items.map((item) => item.day_number))).sort(
    (a, b) => a - b,
  );
  const shown =
    selectedDay === null || !days.includes(selectedDay)
      ? days
      : days.filter((d) => d === selectedDay);
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {items.length} kegiatan · urut per hari dan waktu
        </p>
        <Button onClick={() => onAdd(selectedDay ?? undefined)}>
          <Plus size={15} />
          Tambah kegiatan
        </Button>
      </div>
      {days.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label="Filter hari itinerary"
        >
          <button
            aria-pressed={selectedDay === null}
            onClick={() => setSelectedDay(null)}
            className="shrink-0 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold"
          >
            Semua hari
          </button>
          {days.map((day) => (
            <button
              key={day}
              aria-pressed={selectedDay === day}
              onClick={() => setSelectedDay(day)}
              className="shrink-0 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold aria-pressed:bg-primary-600 aria-pressed:text-white"
            >
              Hari {day}
            </button>
          ))}
        </div>
      )}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-primary-600" />
          <h2 className="text-sm font-semibold">
            Susun perjalanan hari pertama
          </h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            Tambahkan waktu, lokasi, dan estimasi biaya setiap kegiatan.
          </p>
          <Button onClick={() => onAdd(1)}>Tambah kegiatan</Button>
        </div>
      ) : (
        shown.map((day) => {
          const daily = items.filter((item) => item.day_number === day),
            total = daily.reduce(
              (sum, item) =>
                sum +
                (item.budget_items ?? []).reduce((n, b) => n + b.amount, 0),
              0,
            );
          return (
            <section
              key={day}
              className="min-w-0 space-y-3"
              aria-label={`Jadwal hari ${day}`}
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold">Hari {day}</h2>
                  <p className="text-xs text-muted-foreground">
                    {new Date(
                      `${dayDate(trip.start_date, day)}T12:00:00`,
                    ).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <p className="max-w-full break-words text-xs text-muted-foreground">
                  {daily.length} kegiatan · Estimasi{" "}
                  <strong className="text-foreground">
                    {total > 0 ? rupiah(total) : "belum diisi"}
                  </strong>
                </p>
              </header>
              <ol className="space-y-3">
                {daily.map((item) => (
                  <li
                    key={item.id}
                    className="trip-itinerary-card overflow-hidden rounded-2xl border border-border bg-card sm:grid sm:grid-cols-[100px_minmax(0,1fr)]"
                  >
                    <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3 py-2 sm:flex-col sm:items-start sm:justify-start sm:border-b-0 sm:border-r sm:p-4">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-primary-600" />
                      <p className="text-xs font-semibold tabular-nums">
                        {item.time_start
                          ? `${item.time_start} – ${item.time_end}`
                          : "Waktu fleksibel"}
                      </p>
                    </div>
                    <div className="min-w-0 p-3 sm:p-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-semibold">
                            {item.title}
                          </h3>
                          {item.location && (
                            <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                              <span className="min-w-0 break-words">
                                {item.location}
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0">
                          <button
                            onClick={() => onEdit(item)}
                            aria-label={`Edit kegiatan ${item.title}`}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            disabled={deleting}
                            aria-label={`Hapus kegiatan ${item.title}`}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {item.location_url &&
                        /^https?:\/\//i.test(item.location_url) && (
                          <a
                            href={item.location_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-200"
                          >
                            Buka peta <ExternalLink size={12} />
                          </a>
                        )}
                      {item.notes && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                          {item.notes}
                        </p>
                      )}
                      {overlaps.has(item.id) && (
                        <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                          Jam beririsan dengan kegiatan lain pada hari ini.
                        </p>
                      )}
                      {(item.budget_items ?? []).length > 0 ? (
                        <details className="trip-cost-details mt-3 min-w-0 rounded-xl border border-border bg-muted/40">
                          <summary className="trip-cost-summary flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2">
                            <span className="min-w-0 text-xs font-medium">
                              Estimasi biaya · {item.budget_items!.length}{" "}
                              rincian
                            </span>
                            <strong className="trip-cost-amount max-w-full break-words text-xs tabular-nums">
                              {rupiah(
                                item.budget_items!.reduce(
                                  (s, b) => s + b.amount,
                                  0,
                                ),
                              )}
                            </strong>
                          </summary>
                          <dl className="space-y-2 border-t border-border px-3 py-2">
                            {item.budget_items!.map((b) => (
                              <div
                                key={b.id}
                                className="trip-cost-row grid min-w-0 grid-cols-1 gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3"
                              >
                                <dt className="min-w-0 break-words text-xs text-muted-foreground">
                                  {b.label}
                                </dt>
                                <dd className="trip-cost-amount max-w-full break-words text-xs font-medium tabular-nums">
                                  {rupiah(b.amount)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Estimasi biaya belum diisi.
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })
      )}
    </div>
  );
}
