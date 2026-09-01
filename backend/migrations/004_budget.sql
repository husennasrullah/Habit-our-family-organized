-- Migration 004: Budget, Expenses, Shopping List

CREATE TABLE IF NOT EXISTS expenses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    created_by  UUID NOT NULL REFERENCES family_members(id),
    amount      NUMERIC(15,2) NOT NULL,
    currency    TEXT NOT NULL DEFAULT 'IDR',
    category    TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    date        DATE NOT NULL,
    receipt_url TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_expenses_family_id ON expenses(family_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date      ON expenses(date);

CREATE TABLE IF NOT EXISTS budgets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    category    TEXT NOT NULL,
    amount      NUMERIC(15,2) NOT NULL,
    period      TEXT NOT NULL DEFAULT 'monthly',
    month       INT NOT NULL,
    year        INT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_budgets_family_id ON budgets(family_id);

CREATE TABLE IF NOT EXISTS shopping_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    added_by    UUID NOT NULL REFERENCES family_members(id),
    name        TEXT NOT NULL,
    quantity    TEXT NOT NULL DEFAULT '1',
    unit        TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL DEFAULT '',
    is_checked  BOOLEAN NOT NULL DEFAULT FALSE,
    checked_by  UUID REFERENCES family_members(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_shopping_items_family_id ON shopping_items(family_id);
