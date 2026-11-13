import type { Trip, TripItinerary, TripExpense } from "@/types";
export function tripDate(value: string) {
  return value.slice(0, 10);
}
export function dayDate(start: string, day: number) {
  const d = new Date(`${tripDate(start)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day - 1);
  return d.toISOString().slice(0, 10);
}
export function tripDuration(start: string, end: string) {
  return (
    Math.round(
      (Date.parse(tripDate(end)) - Date.parse(tripDate(start))) / 86400000,
    ) + 1
  );
}
export function itineraryOverlaps(items: TripItinerary[]) {
  const overlaps = new Set<string>();
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i],
        b = items[j];
      if (
        a.day_number === b.day_number &&
        a.time_start &&
        a.time_end &&
        b.time_start &&
        b.time_end &&
        a.time_start < b.time_end &&
        b.time_start < a.time_end
      ) {
        overlaps.add(a.id);
        overlaps.add(b.id);
      }
    }
  return overlaps;
}
export function tripOverview(trip: Trip) {
  const estimate = (trip.itineraries ?? []).reduce(
    (s, item) =>
      s + (item.budget_items ?? []).reduce((n, b) => n + b.amount, 0),
    0,
  );
  const spent = (trip.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  return {
    estimate,
    spent,
    budget: trip.budget_estimate,
    remaining:
      trip.budget_estimate > 0
        ? Math.round((trip.budget_estimate - spent) * 100) / 100
        : null,
  };
}
export function equalShares(amount: number, memberIDs: string[]) {
  const ids = [...memberIDs].sort(),
    cents = Math.round(amount * 100),
    base = ids.length ? Math.floor(cents / ids.length) : 0,
    remainder = ids.length ? cents % ids.length : 0;
  return ids.map((member_id, i) => ({
    member_id,
    amount: (base + (i < remainder ? 1 : 0)) / 100,
  }));
}
export function settlementRows(expenses: TripExpense[]) {
  return expenses.flatMap((expense) =>
    (expense.splits ?? [])
      .filter(
        (s) => s.member_id !== expense.paid_by && s.amount > 0 && !s.is_settled,
      )
      .map((split) => ({ expense, split })),
  );
}
export function sortedItineraries(items: TripItinerary[]) {
  return [...items].sort(
    (a, b) =>
      a.day_number - b.day_number ||
      (a.time_start || "99:99").localeCompare(b.time_start || "99:99") ||
      a.sort_order - b.sort_order ||
      a.id.localeCompare(b.id),
  );
}
