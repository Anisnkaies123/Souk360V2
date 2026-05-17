export type Shop = {
  id: string;
  name: string;
  /** Display label (e.g. Artisans) */
  category: string;
  /** Same as CATEGORIES[].value for filters */
  categorySlug: string;
  categoryIcon: string;
  address: string;
  lat?: number;
  lng?: number;
  phone: string;
  whatsapp: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  isVerified: boolean;
  description: string;
  accepts_bookings?: boolean;
  ownerId?: string;
  hours: { day: string; time: string }[];
  photos: string[];
  /** Public Supabase Storage URL for an optional promo video */
  videoUrl: string | null;
  distance?: string;
};

export type Review = {
  id: string;
  shopId: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
};

export const CATEGORIES = [
  { label: 'Artisans', icon: '🔨', value: 'artisans' },
  { label: 'Médecins', icon: '🏥', value: 'medecins' },
  { label: 'Mécaniciens', icon: '🔧', value: 'mecaniciens' },
  { label: 'Frippe', icon: '👗', value: 'frippe' },
  { label: 'Cafés', icon: '☕', value: 'cafes' },
  { label: 'Restaurants', icon: '🍽️', value: 'restaurants' },
  { label: 'Épiceries', icon: '🛒', value: 'epiceries' },
  { label: 'Coiffeurs', icon: '✂️', value: 'coiffeurs' },
];

export function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}
