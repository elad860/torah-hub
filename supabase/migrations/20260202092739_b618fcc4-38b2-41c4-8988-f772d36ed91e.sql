-- Create lessons table for video content
CREATE TABLE public.lessons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'כללי',
    series TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (content is publicly accessible)
CREATE POLICY "Anyone can view lessons" 
ON public.lessons 
FOR SELECT 
USING (true);

-- Create index for category filtering
CREATE INDEX idx_lessons_category ON public.lessons(category);

-- Create index for series filtering
CREATE INDEX idx_lessons_series ON public.lessons(series);