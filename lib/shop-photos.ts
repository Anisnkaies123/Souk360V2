import { supabase } from '@/lib/supabase';

export const SHOP_PHOTOS_BUCKET = 'shop-photos';
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_SHOP_PHOTOS = 8;
export const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type ShopPhotoUpload = {
  id: string;
  previewUrl: string;
  publicUrl?: string;
  storagePath?: string;
  uploading: boolean;
  error?: string;
};

export function validateShopPhotoFile(file: File): string | null {
  if (!ALLOWED_PHOTO_MIME.includes(file.type as (typeof ALLOWED_PHOTO_MIME)[number])) {
    return 'Format non supporté. Utilisez JPG ou PNG.';
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return 'Fichier trop volumineux (max 5 Mo).';
  }
  return null;
}

function extensionForFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function uploadShopPhoto(
  file: File,
  userId: string,
): Promise<{ publicUrl: string; storagePath: string }> {
  const ext = extensionForFile(file);
  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(SHOP_PHOTOS_BUCKET).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(SHOP_PHOTOS_BUCKET).getPublicUrl(storagePath);
  return { publicUrl: data.publicUrl, storagePath };
}

export async function deleteShopPhoto(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(SHOP_PHOTOS_BUCKET).remove([storagePath]);
  if (error) {
    throw error;
  }
}
