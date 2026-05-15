-- Add optional introductory video URL for each shop (public Supabase Storage URL).
alter table public.shops add column if not exists video_url text;

comment on column public.shops.video_url is 'Public URL to a short MP4/WebM preview in bucket shop-videos; null if none.';
