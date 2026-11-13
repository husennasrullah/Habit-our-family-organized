-- Preserve completion time separately from subsequent metadata edits.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
-- Best available estimate for historical tasks, applied only when unknown.
UPDATE tasks SET completed_at = updated_at
WHERE status = 'done' AND completed_at IS NULL;
