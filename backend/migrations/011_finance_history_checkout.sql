-- Additive migration: preserves all existing expenses, goals and shopping items.
CREATE TABLE IF NOT EXISTS financial_goal_entries (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 goal_id UUID NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
 actor_id UUID REFERENCES family_members(id),
 amount NUMERIC(15,2) NOT NULL,
 balance_after NUMERIC(15,2) NOT NULL,
 kind TEXT NOT NULL,
 note TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_financial_goal_entries_family_id ON financial_goal_entries(family_id);
CREATE INDEX IF NOT EXISTS idx_financial_goal_entries_goal_id ON financial_goal_entries(goal_id);
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES expenses(id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_expense_id ON shopping_items(expense_id);
-- Legacy balances get an explicitly labelled opening entry lazily under row lock,
-- on the first subsequent balance change. No historical deposits are invented.
