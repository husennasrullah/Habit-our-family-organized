-- Migration 006: Kids Tracker

CREATE TABLE IF NOT EXISTS kid_profiles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id   UUID REFERENCES family_members(id),
    name        TEXT NOT NULL,
    gender      TEXT NOT NULL DEFAULT '',
    birth_date  DATE NOT NULL,
    avatar_url  TEXT NOT NULL DEFAULT '',
    notes       TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_kid_profiles_family_id ON kid_profiles(family_id);

CREATE TABLE IF NOT EXISTS growth_records (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id                UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
    date                  DATE NOT NULL,
    height_cm             NUMERIC(5,2),
    weight_kg             NUMERIC(5,2),
    head_circumference_cm NUMERIC(5,2),
    notes                 TEXT NOT NULL DEFAULT '',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_growth_records_kid_id ON growth_records(kid_id);

CREATE TABLE IF NOT EXISTS vaccine_records (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id         UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
    vaccine_name   TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    given_date     DATE,
    given_by       TEXT NOT NULL DEFAULT '',
    notes          TEXT NOT NULL DEFAULT '',
    status         TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','given','overdue')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_vaccine_records_kid_id ON vaccine_records(kid_id);

CREATE TABLE IF NOT EXISTS milestones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id      UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT '',
    achieved_at DATE,
    notes       TEXT NOT NULL DEFAULT '',
    is_achieved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_milestones_kid_id ON milestones(kid_id);

CREATE TABLE IF NOT EXISTS health_records (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kid_id      UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    description TEXT NOT NULL,
    date        DATE NOT NULL,
    doctor      TEXT NOT NULL DEFAULT '',
    medication  TEXT NOT NULL DEFAULT '',
    notes       TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_health_records_kid_id ON health_records(kid_id);
