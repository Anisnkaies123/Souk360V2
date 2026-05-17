ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS lat float,
  ADD COLUMN IF NOT EXISTS lng float;
