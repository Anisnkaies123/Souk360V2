-- Run in Supabase → SQL Editor (after shops.video_url exists; see migration add_shops_video_url).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-videos',
  'shop-videos',
  true,
  52428800,
  array['video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "shop_videos_select_public" on storage.objects;
create policy "shop_videos_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'shop-videos');

drop policy if exists "shop_videos_insert_own" on storage.objects;
create policy "shop_videos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'shop-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "shop_videos_delete_own" on storage.objects;
create policy "shop_videos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'shop-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
