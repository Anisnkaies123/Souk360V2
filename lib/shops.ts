import { supabase } from '@/lib/supabase';
import type { Shop } from '@/lib/data';
import { CATEGORIES } from '@/lib/data';

export const PLACEHOLDER_SHOP_IMAGE =
  'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=800';

const DISPLAY_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
const JS_WEEKDAY_TO_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;

export type HoursEntry = { open: boolean; from: string; to: string };

export type ShopRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  photos: string[] | null;
  whatsapp: string | null;
  hours: Record<string, HoursEntry> | null;
  is_approved: boolean;
  owner_id: string | null;
  created_at: string;
};

const SHOP_SELECT =
  'id, name, category, description, phone, address, photos, whatsapp, hours, is_approved, owner_id, created_at';

function parseHours(raw: unknown): Record<string, HoursEntry> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as Record<string, HoursEntry>;
}

function normalizeShopRows(rows: unknown[]): ShopRow[] {
  return rows.map((row) => {
    const r = row as ShopRow & { hours?: unknown };
    return {
      id: r.id,
      name: r.name,
      category: r.category,
      description: r.description ?? null,
      phone: r.phone ?? null,
      address: r.address ?? null,
      photos: Array.isArray(r.photos) ? r.photos : null,
      whatsapp: r.whatsapp ?? null,
      hours: parseHours(r.hours),
      is_approved: Boolean(r.is_approved),
      owner_id: r.owner_id ?? null,
      created_at: r.created_at,
    };
  });
}

function mapHoursJson(
  hours: Record<string, HoursEntry> | null,
): { day: string; time: string }[] {
  if (!hours || typeof hours !== 'object') {
    return [{ day: 'Horaires', time: 'Non renseigné' }];
  }
  return DISPLAY_DAYS.map((day) => {
    const h = hours[day] as HoursEntry | undefined;
    if (!h || !h.open) return { day, time: 'Fermé' };
    return { day, time: `${h.from} – ${h.to}` };
  });
}

function computeIsOpen(hours: Record<string, HoursEntry> | null): boolean {
  if (!hours || typeof hours !== 'object') return false;
  const day = JS_WEEKDAY_TO_FR[new Date().getDay()];
  const slot = hours[day] as HoursEntry | undefined;
  if (!slot?.open || !slot.from || !slot.to) return false;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const toM = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const a = toM(slot.from);
  const b = toM(slot.to);
  if (b < a) return nowM >= a || nowM <= b;
  return nowM >= a && nowM <= b;
}

function mapRowToShop(
  row: ShopRow,
  stats: { avg: number; count: number },
  distance?: string,
): Shop {
  const cat = CATEGORIES.find((c) => c.value === row.category);
  const photos =
    row.photos && row.photos.length > 0 ? row.photos : [PLACEHOLDER_SHOP_IMAGE];
  const avg = stats.count > 0 ? Math.round(stats.avg * 10) / 10 : 0;
  const hoursJson = row.hours;

  return {
    id: row.id,
    name: row.name,
    category: cat?.label ?? row.category,
    categorySlug: row.category,
    categoryIcon: cat?.icon ?? '🏪',
    address: row.address ?? '',
    phone: row.phone ?? '',
    whatsapp: row.whatsapp ?? row.phone ?? '',
    rating: avg,
    reviewCount: stats.count,
    isOpen: computeIsOpen(hoursJson),
    isVerified: row.is_approved,
    description: row.description ?? '',
    hours: mapHoursJson(hoursJson),
    photos,
    distance,
  };
}

async function reviewStatsForShopIds(
  shopIds: string[],
): Promise<Map<string, { sum: number; count: number }>> {
  const stats = new Map<string, { sum: number; count: number }>();
  if (shopIds.length === 0) return stats;
  const { data: revs, error } = await supabase
    .from('reviews')
    .select('shop_id, rating')
    .in('shop_id', shopIds);
  if (error || !revs) return stats;
  for (const r of normalizeReviewStatRows(revs)) {
    const cur = stats.get(r.shop_id) || { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    stats.set(r.shop_id, cur);
  }
  return stats;
}

function normalizeReviewStatRows(rows: unknown): { shop_id: string; rating: number }[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    const r = row as { shop_id?: unknown; rating?: unknown };
    if (typeof r.shop_id !== 'string' || typeof r.rating !== 'number') return [];
    return [{ shop_id: r.shop_id, rating: r.rating }];
  });
}

export async function fetchApprovedShops(): Promise<Shop[]> {
  const { data: rows, error } = await supabase
    .from('shops')
    .select(SHOP_SELECT)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error || !rows?.length) return [];

  const shopRows = normalizeShopRows(rows);
  const statsMap = await reviewStatsForShopIds(shopRows.map((r) => r.id));

  return shopRows.map((row) => {
    const s = statsMap.get(row.id) || { sum: 0, count: 0 };
    const avg = s.count > 0 ? s.sum / s.count : 0;
    return mapRowToShop(row, { avg, count: s.count });
  });
}

export async function fetchApprovedShopById(id: string): Promise<Shop | null> {
  const { data: row, error } = await supabase
    .from('shops')
    .select(SHOP_SELECT)
    .eq('id', id)
    .eq('is_approved', true)
    .maybeSingle();

  if (error || !row) return null;

  const shopRow = normalizeShopRows([row])[0];
  if (!shopRow) return null;
  const statsMap = await reviewStatsForShopIds([shopRow.id]);
  const s = statsMap.get(shopRow.id) || { sum: 0, count: 0 };
  const avg = s.count > 0 ? s.sum / s.count : 0;
  return mapRowToShop(shopRow, { avg, count: s.count });
}

export type ReviewWithAuthor = {
  id: string;
  shopId: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
};

/** Nested profile from Supabase join; full_name is nullable in the DB. */
type ReviewProfile = {
  full_name: string | null;
};

function reviewAuthorName(profiles: unknown): string {
  if (!profiles) return 'Utilisateur';
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  if (!profile || typeof profile !== 'object') return 'Utilisateur';
  const name = (profile as ReviewProfile).full_name;
  return typeof name === 'string' && name.trim() ? name.trim() : 'Utilisateur';
}

function getStringField(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return typeof value === 'string' ? value : '';
}

function getNumberField(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  return typeof value === 'number' ? value : 0;
}

function mapReviewRows(data: unknown): ReviewWithAuthor[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const r = row as Record<string, unknown>;
    return {
      id: getStringField(r, 'id'),
      shopId: getStringField(r, 'shop_id'),
      author: reviewAuthorName(r.profiles),
      rating: getNumberField(r, 'rating'),
      date: getStringField(r, 'created_at'),
      comment: getStringField(r, 'comment'),
    };
  });
}

export async function fetchReviewsForShop(shopId: string): Promise<ReviewWithAuthor[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, shop_id, user_id, rating, comment, created_at, profiles(full_name)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return mapReviewRows(data);
}

export async function fetchPublicStats(): Promise<{
  shopCount: number;
  reviewCount: number;
}> {
  const shops = await supabase
    .from('shops')
    .select('id', { count: 'exact', head: true })
    .eq('is_approved', true);

  const reviews = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true });

  return {
    shopCount: shops.count ?? 0,
    reviewCount: reviews.count ?? 0,
  };
}
