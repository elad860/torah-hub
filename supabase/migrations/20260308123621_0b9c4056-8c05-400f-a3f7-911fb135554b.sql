ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS content_text TEXT;
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS content_text TEXT;