-- Run in Supabase → SQL Editor after schema.sql (creates public bucket for shop images).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-photos',
  'shop-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "shop_photos_select_public" on storage.objects;
create policy "shop_photos_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'shop-photos');

drop policy if exists "shop_photos_insert_own" on storage.objects;
create policy "shop_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'shop-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "shop_photos_delete_own" on storage.objects;
create policy "shop_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'shop-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
