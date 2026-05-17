-- Run this in Supabase SQL Editor to fix all RLS conflicts from previous migrations.
-- This drops all existing policies and recreates them cleanly.

-- Drop all existing policies
DROP POLICY IF EXISTS "shops_select_public" ON public.shops;
DROP POLICY IF EXISTS "shops_select_authenticated" ON public.shops;
DROP POLICY IF EXISTS "shops_select_owner" ON public.shops;
DROP POLICY IF EXISTS "shops_insert_owner" ON public.shops;
DROP POLICY IF EXISTS "shops_update_owner" ON public.shops;
DROP POLICY IF EXISTS "shops_update_admin" ON public.shops;
DROP POLICY IF EXISTS "shops_delete_owner" ON public.shops;
DROP POLICY IF EXISTS "shops_delete_admin" ON public.shops;
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
DROP POLICY IF EXISTS "reviews_select_authenticated" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON public.reviews;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_owner" ON public.profiles;

-- Recreate policies cleanly

-- profiles policies
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "profiles_update_owner"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- shops policies for anon (public users)
CREATE POLICY "shops_select_public"
  ON public.shops FOR SELECT TO anon
  USING (is_approved = true);

-- shops policies for authenticated users
CREATE POLICY "shops_select_authenticated"
  ON public.shops FOR SELECT TO authenticated
  USING (
    is_approved = true 
    OR owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "shops_insert_owner"
  ON public.shops FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "shops_update_owner_or_admin"
  ON public.shops FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "shops_delete_owner_or_admin"
  ON public.shops FOR DELETE TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- reviews policies
CREATE POLICY "reviews_select_public"
  ON public.reviews FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shops s 
    WHERE s.id = shop_id AND s.is_approved = true
  ));

CREATE POLICY "reviews_insert_authenticated"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.shops s 
      WHERE s.id = shop_id AND s.is_approved = true
    )
  );

-- Re-apply GRANTs
GRANT SELECT ON public.shops TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shops TO authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
