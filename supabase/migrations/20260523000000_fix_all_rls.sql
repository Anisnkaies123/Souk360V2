-- Run this in Supabase SQL Editor to fix all RLS conflicts from previous migrations.
-- This drops all existing policies and recreates them cleanly.

-- Drop all policies on tables using a DO block
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('shops', 'reviews', 'profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, policy_record.tablename);
  END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE POLICY "shops_update_owner_or_admin"
  ON public.shops FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE OR REPLACE POLICY "shops_delete_owner_or_admin"
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
