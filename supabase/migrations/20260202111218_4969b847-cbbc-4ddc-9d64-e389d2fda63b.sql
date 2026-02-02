-- Create podcasts table for Spotify episodes
CREATE TABLE public.podcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  spotify_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view podcasts" 
  ON public.podcasts 
  FOR SELECT 
  USING (true);

-- Add some sample data
INSERT INTO public.podcasts (title, description, spotify_url) VALUES
  ('פרשת השבוע - יתרו', 'שיעור מעמיק על פרשת יתרו ומעמד הר סיני', 'https://open.spotify.com/episode/placeholder1'),
  ('הלכות שבת', 'הלכות מעשיות לשבת קודש', 'https://open.spotify.com/episode/placeholder2'),
  ('מוסר - עבודת המידות', 'שיעור בעבודת המידות והתיקון העצמי', 'https://open.spotify.com/episode/placeholder3');