
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  book_title TEXT NOT NULL,
  book_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (no auth required for purchasing)
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Only service role can read orders
CREATE POLICY "Service role can view orders"
ON public.orders
FOR SELECT
USING (false);
