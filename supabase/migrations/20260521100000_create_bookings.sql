CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  date date NOT NULL,
  time_slot text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS bookings_shop_date_idx
  ON public.bookings (shop_id, date, time_slot);

CREATE POLICY "bookings_select_client"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "bookings_select_owner"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "bookings_insert_client"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "bookings_update_owner"
  ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "bookings_update_client"
  ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = client_id);

GRANT SELECT ON public.bookings TO authenticated;
GRANT INSERT ON public.bookings TO authenticated;
GRANT UPDATE ON public.bookings TO authenticated;

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS accepts_bookings boolean DEFAULT false;
