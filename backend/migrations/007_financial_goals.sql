-- Migration 007: Financial Goals (Target Keuangan Keluarga Jangka Panjang)

CREATE TABLE IF NOT EXISTS financial_goals (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id      UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    created_by     UUID NOT NULL REFERENCES family_members(id),
    title          TEXT NOT NULL,
    target_amount  NUMERIC(15,2) NOT NULL,
    current_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    deadline       DATE,
    notes          TEXT NOT NULL DEFAULT '',
    is_achieved    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_financial_goals_family_id ON financial_goals(family_id);
