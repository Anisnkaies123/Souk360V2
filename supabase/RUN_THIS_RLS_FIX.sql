alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.reviews enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.shops to anon, authenticated;
grant insert, update, delete on public.shops to authenticated;
grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
on public.profiles
for select
to anon, authenticated
using (true);

drop policy if exists "shops_select_public_or_owner" on public.shops;
drop policy if exists "shops_select_anon_approved" on public.shops;
drop policy if exists "shops_select_authenticated_public_or_owner" on public.shops;
drop policy if exists "shops_select_admin" on public.shops;

create policy "shops_select_anon_approved"
on public.shops
for select
to anon
using (is_approved = true);

create policy "shops_select_authenticated_public_or_owner"
on public.shops
for select
to authenticated
using (is_approved = true or auth.uid() = owner_id);

create policy "shops_select_admin"
on public.shops
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "shops_update_admin" on public.shops;
create policy "shops_update_admin"
on public.shops
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "shops_delete_admin" on public.shops;
create policy "shops_delete_admin"
on public.shops
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "reviews_select_on_approved_shop" on public.reviews;
create policy "reviews_select_on_approved_shop"
on public.reviews
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.shops s
    where s.id = shop_id
      and s.is_approved = true
  )
);

drop policy if exists "reviews_select_admin" on public.reviews;
create policy "reviews_select_admin"
on public.reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

select 'RLS fix applied successfully' as status;
