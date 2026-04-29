
-- =========================================
-- 1. USER ROLES SYSTEM (admin role)
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Only admins can view/manage roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 2. LOCK DOWN articles / lessons / podcasts
-- (SELECT public, write only by admins)
-- =========================================

-- ARTICLES
CREATE POLICY "Admins can insert articles"
  ON public.articles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update articles"
  ON public.articles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete articles"
  ON public.articles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- LESSONS
CREATE POLICY "Admins can insert lessons"
  ON public.lessons FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lessons"
  ON public.lessons FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lessons"
  ON public.lessons FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- PODCASTS
CREATE POLICY "Admins can insert podcasts"
  ON public.podcasts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update podcasts"
  ON public.podcasts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete podcasts"
  ON public.podcasts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- 3. ORDERS — input validation + rate limit
-- =========================================

-- Drop overly-permissive existing policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can view orders" ON public.orders;

-- Add CHECK constraints (immutable, safe to use here)
ALTER TABLE public.orders
  ADD CONSTRAINT orders_price_positive CHECK (book_price > 0 AND book_price <= 10000),
  ADD CONSTRAINT orders_full_name_len CHECK (char_length(full_name) BETWEEN 2 AND 100),
  ADD CONSTRAINT orders_phone_len CHECK (char_length(phone) BETWEEN 9 AND 15),
  ADD CONSTRAINT orders_email_len CHECK (char_length(email) BETWEEN 5 AND 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT orders_book_title_len CHECK (char_length(book_title) BETWEEN 1 AND 300);

-- Rate-limit trigger: max 5 orders per minute per email
CREATE OR REPLACE FUNCTION public.enforce_orders_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.orders
  WHERE lower(email) = lower(NEW.email)
    AND created_at > now() - INTERVAL '1 minute';

  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many orders. Please wait before trying again.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_rate_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_orders_rate_limit();

-- New policies: anon can INSERT (validated by constraints), only admins can SELECT
CREATE POLICY "Anyone can create validated orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
