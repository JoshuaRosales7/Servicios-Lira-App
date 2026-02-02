-- Migration to add title and is_pinned to notes table
-- and align author_id with user_id naming convention used in the app

ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Check if author_id exists before renaming
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='author_id') THEN
    ALTER TABLE public.notes RENAME COLUMN author_id TO user_id;
  END IF;
END $$;
