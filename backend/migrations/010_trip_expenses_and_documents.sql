-- Migration 010: Trip Expenses & Trip Documents

-- 1. Trip Expenses (Realisasi Pengeluaran Liburan & Talangan/Split)
CREATE TABLE IF NOT EXISTS trip_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL DEFAULT 'Lain-lain', -- Transportasi, Penginapan, Kuliner, Tiket/Wisata, Belanja/Oleh-oleh, Lain-lain
    date DATE NOT NULL,
    paid_by UUID REFERENCES family_members(id) ON DELETE SET NULL,
    notes TEXT,
    split_type VARCHAR(50) DEFAULT 'all', -- 'all', 'custom'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_family_id ON trip_expenses(family_id);

-- 2. Trip Expense Participants (untuk split bill / patungan anggota)
CREATE TABLE IF NOT EXISTS trip_expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES trip_expenses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_expense_splits_expense_id ON trip_expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_trip_expense_splits_member_id ON trip_expense_splits(member_id);

-- 3. Trip Documents (Penyimpanan Dokumen, Tiket, Voucher, Bukti Reservasi)
CREATE TABLE IF NOT EXISTS trip_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES family_members(id),
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50) DEFAULT 'other', -- 'ticket', 'hotel', 'insurance', 'visa', 'other'
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT DEFAULT 0,
    file_type VARCHAR(100) DEFAULT '',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trip_documents_trip_id ON trip_documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_documents_family_id ON trip_documents(family_id);
