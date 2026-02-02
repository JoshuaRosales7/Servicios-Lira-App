-- Change actor_id FK to point to profiles table instead of auth.users
-- This allows PostgREST to detect the relationship for joins

ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;

ALTER TABLE notifications
ADD CONSTRAINT notifications_actor_id_fkey
FOREIGN KEY (actor_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;
