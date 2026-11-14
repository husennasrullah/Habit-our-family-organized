-- Additive metadata; old files remain at their existing object keys.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name text DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_type text DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_delete_pending boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_documents_storage_delete_pending ON documents(storage_delete_pending);
