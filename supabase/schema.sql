-- Souk360: run once in Supabase → SQL Editor (postgres role bypasses RLS for manual seeds).
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles (synced from auth via trigger)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'owner', 'admin'))
);

-- ---------------------------------------------------------------------------
-- shops
-- ---------------------------------------------------------------------------
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  phone text,
  address text,
  photos text[] not null default '{}',
  video_url text,
  whatsapp text,
  hours jsonb,
  accepts_bookings boolean default false,
  is_approved boolean not null default false,
  owner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index shops_owner_idx on public.shops (owner_id);
create index shops_approved_idx on public.shops (is_approved) where is_approved = true;

-- ---------------------------------------------------------------------------
-- reviews (user_id → profiles for nested selects in the app)
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index reviews_shop_idx on public.reviews (shop_id);

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references auth.users (id) on delete cascade,
  client_name text not null,
  client_phone text not null,
  date date not null,
  time_slot text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create index bookings_shop_date_idx on public.bookings (shop_id, date, time_slot);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.reviews enable row level security;
alter table public.bookings enable row level security;

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "shops_select_anon_approved"
  on public.shops for select
  to anon
  using (is_approved = true);

create policy "shops_select_authenticated_public_or_owner"
  on public.shops for select
  to authenticated
  using (is_approved = true or auth.uid() = owner_id);

create policy "shops_insert_authenticated_owner"
  on public.shops for insert
  with check (auth.uid() is not null and auth.uid() = owner_id);

create policy "shops_update_own"
  on public.shops for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "reviews_select_on_approved_shop"
  on public.reviews for select
  using (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.is_approved = true
    )
  );

create policy "reviews_insert_authenticated_approved_shop"
  on public.reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.shops s
      where s.id = shop_id and s.is_approved = true
    )
  );

create policy "bookings_select_client"
  on public.bookings for select
  to authenticated
  using (auth.uid() = client_id);

create policy "bookings_select_owner"
  on public.bookings for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "bookings_insert_client"
  on public.bookings for insert
  to authenticated
  with check (auth.uid() = client_id);

create policy "bookings_update_owner"
  on public.bookings for update
  to authenticated
  using (auth.uid() = owner_id);

create policy "bookings_update_client"
  on public.bookings for update
  to authenticated
  using (auth.uid() = client_id);

-- Admin (profiles.role = 'admin'): modération complète
grant delete on table public.shops to authenticated;

create policy "shops_select_admin"
  on public.shops for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

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

create policy "shops_delete_admin"
  on public.shops for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "reviews_select_admin"
  on public.reviews for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- New user → profile row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    'user'
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Grants (Supabase roles)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

grant select on public.shops to anon, authenticated;
grant insert, update on public.shops to authenticated;

grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;

grant select, insert, update on public.bookings to authenticated;
