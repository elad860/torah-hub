
-- Add download_url to articles for Google Drive PDF/download links
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS download_url text;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS source_video_id text;

-- Add audio_url to podcasts for Google Drive audio links
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS source_video_id text;
