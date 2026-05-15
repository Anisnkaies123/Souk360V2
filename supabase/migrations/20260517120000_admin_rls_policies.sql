-- Admin moderation: full shop visibility, approve/update, delete; review counts for dashboard.
-- Promote a user in SQL: update public.profiles set role = 'admin' where id = '<uuid>';

grant delete on table public.shops to authenticated;

drop policy if exists "shops_select_admin" on public.shops;
create policy "shops_select_admin"
  on public.shops for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "shops_update_admin" on public.shops;
create policy "shops_update_admin"
  on public.shops for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "shops_delete_admin" on public.shops;
create policy "shops_delete_admin"
  on public.shops for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "reviews_select_admin" on public.reviews;
create policy "reviews_select_admin"
  on public.reviews for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
