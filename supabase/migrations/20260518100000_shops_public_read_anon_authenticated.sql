-- Ensure anonymous API clients (anon role) can list approved shops; authenticated users see approved + own pending.
-- Fixes empty public homepage/search when the generic SELECT policy did not apply cleanly to `anon`.

drop policy if exists "shops_select_public_or_owner" on public.shops;

drop policy if exists "shops_select_anon_approved" on public.shops;
create policy "shops_select_anon_approved"
  on public.shops for select
  to anon
  using (is_approved = true);

drop policy if exists "shops_select_authenticated_public_or_owner" on public.shops;
create policy "shops_select_authenticated_public_or_owner"
  on public.shops for select
  to authenticated
  using (is_approved = true or auth.uid() = owner_id);

-- Note: admins still use existing policy "shops_select_admin" (full visibility).
