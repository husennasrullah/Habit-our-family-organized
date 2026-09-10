-- Migration 008: Family Trip & Vacation Planner

-- 1. Trips Table
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES family_members(id),
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cover_image_url TEXT,
    budget_estimate NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'ongoing', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trips_family_id ON trips(family_id);

-- 2. Trip Members (Junction Table)
CREATE TABLE IF NOT EXISTS trip_members (
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    PRIMARY KEY (trip_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_member_id ON trip_members(member_id);

-- 3. Trip Itineraries
CREATE TABLE IF NOT EXISTS trip_itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_number INT NOT NULL DEFAULT 1,
    date DATE,
    time_start VARCHAR(10),
    time_end VARCHAR(10),
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    location_url TEXT,
    notes TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trip_itineraries_trip_id ON trip_itineraries(trip_id);

-- 4. Trip Packing Items
CREATE TABLE IF NOT EXISTS trip_packing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    assigned_to UUID REFERENCES family_members(id) ON DELETE SET NULL,
    is_packed BOOLEAN DEFAULT FALSE,
    packed_by UUID REFERENCES family_members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trip_packing_items_trip_id ON trip_packing_items(trip_id);
