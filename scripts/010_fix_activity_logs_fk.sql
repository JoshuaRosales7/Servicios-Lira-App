-- Change actor_id FK in activity_logs to point to profiles table instead of auth.users
ALTER TABLE activity_logs
DROP CONSTRAINT IF EXISTS activity_logs_actor_id_fkey;

ALTER TABLE activity_logs
ADD CONSTRAINT activity_logs_actor_id_fkey
FOREIGN KEY (actor_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON activity_logs(actor_id);
