CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  type text NOT NULL DEFAULT 'annonce'
    CHECK (type IN ('annonce', 'promo', 'nouveaute', 'evenement')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_public"
  ON public.posts FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = shop_id AND s.is_approved = true
  ));

CREATE POLICY "posts_insert_owner"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "posts_update_owner"
  ON public.posts FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "posts_delete_owner"
  ON public.posts FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
