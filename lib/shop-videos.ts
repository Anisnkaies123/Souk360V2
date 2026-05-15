import { supabase } from '@/lib/supabase';

export const SHOP_VIDEOS_BUCKET = 'shop-videos';
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
export const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/webm'] as const;

export function validateShopVideoFile(file: File): string | null {
  if (!ALLOWED_VIDEO_MIME.includes(file.type as (typeof ALLOWED_VIDEO_MIME)[number])) {
    return 'Format non supporté. Utilisez MP4 ou WebM.';
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return 'Vidéo trop volumineuse (max 50 Mo).';
  }
  return null;
}

function extensionForFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName === 'webm') return 'webm';
  if (fromName === 'mp4') return 'mp4';
  if (file.type === 'video/webm') return 'webm';
  return 'mp4';
}

export async function uploadShopVideo(
  file: File,
  userId: string,
): Promise<{ publicUrl: string; storagePath: string }> {
  const ext = extensionForFile(file);
  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(SHOP_VIDEOS_BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(SHOP_VIDEOS_BUCKET).getPublicUrl(storagePath);
  return { publicUrl: data.publicUrl, storagePath };
}

export async function deleteShopVideo(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(SHOP_VIDEOS_BUCKET).remove([storagePath]);
  if (error) throw error;
}
