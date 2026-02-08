
-- Add playlist and publish date columns to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS playlist_id TEXT,
ADD COLUMN IF NOT EXISTS playlist_name TEXT,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Backfill published_at from created_at for existing records
UPDATE public.lessons SET published_at = created_at WHERE published_at IS NULL;

-- Add index for filtering by playlist
CREATE INDEX IF NOT EXISTS idx_lessons_playlist_id ON public.lessons(playlist_id);

-- Add index for date ordering
CREATE INDEX IF NOT EXISTS idx_lessons_published_at ON public.lessons(published_at DESC);
