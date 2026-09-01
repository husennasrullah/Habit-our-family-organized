-- Migration 001: Initial schema — families & family_members
-- Dijalankan otomatis via GORM AutoMigrate

-- Tabel families
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_families_invite_code ON families(invite_code);

-- Tabel family_members
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',   -- admin | member | child | view_only
    avatar_url TEXT NOT NULL DEFAULT '',
    color VARCHAR(30) NOT NULL DEFAULT 'sky',
    birth_date DATE,
    auth_provider VARCHAR(10) NOT NULL DEFAULT 'email', -- email | google | both
    google_id TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_email     ON family_members(email);
CREATE INDEX IF NOT EXISTS idx_family_members_google_id ON family_members(google_id);
