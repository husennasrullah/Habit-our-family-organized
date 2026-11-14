CREATE TABLE IF NOT EXISTS auth_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
 member_id uuid NOT NULL, refresh_hash text NOT NULL, expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_member_id ON auth_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_deleted_at ON auth_sessions(deleted_at);
ALTER TABLE families ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz;
UPDATE families SET invite_expires_at=now()+interval '7 days' WHERE invite_expires_at IS NULL;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS avatar_object_key text DEFAULT '';
-- Old untyped tokens have no persisted session and require signing in once.

DO $$ BEGIN
 IF to_regclass('push_subscriptions') IS NOT NULL THEN
  ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS session_id uuid;
  CREATE INDEX IF NOT EXISTS idx_push_subscriptions_session_id ON push_subscriptions(session_id);
  UPDATE push_subscriptions SET deleted_at=now() WHERE session_id IS NULL AND deleted_at IS NULL;
 END IF;
END $$;
