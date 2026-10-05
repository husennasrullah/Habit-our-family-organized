-- Migration 010: Trip itinerary budget items (one-to-many)

CREATE TABLE IF NOT EXISTS trip_itinerary_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES trip_itineraries(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_itinerary_budgets_itinerary_id
    ON trip_itinerary_budgets(itinerary_id);
