-- Add actor_id to notifications to track who triggered it
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable RLS for finding public profile of actor if needed (though we fetch on server mostly)
-- Assuming profiles table exists and is public readable or we handle this.

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
