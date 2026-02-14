
-- Add spotify_url and bio columns to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS spotify_url text DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
