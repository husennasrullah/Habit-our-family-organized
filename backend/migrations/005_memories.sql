-- Migration 005: Memories & Photos

CREATE TABLE IF NOT EXISTS memories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    created_by  UUID NOT NULL REFERENCES family_members(id),
    title       TEXT NOT NULL,
    content     TEXT NOT NULL DEFAULT '',
    date        DATE NOT NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_memories_family_id ON memories(family_id);
CREATE INDEX IF NOT EXISTS idx_memories_date      ON memories(date);

CREATE TABLE IF NOT EXISTS memory_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id   UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    object_key  TEXT NOT NULL,
    caption     TEXT NOT NULL DEFAULT '',
    "order"     INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_memory_photos_memory_id ON memory_photos(memory_id);
