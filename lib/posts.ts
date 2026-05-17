export type PostType = 'annonce' | 'promo' | 'nouveaute' | 'evenement';

export type PostRow = {
  id: string;
  shop_id: string;
  owner_id: string;
  title: string;
  content: string;
  image_url: string | null;
  type: PostType;
  created_at: string;
};

export const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'annonce', label: '📢 Annonce' },
  { value: 'promo', label: '🏷️ Promo' },
  { value: 'nouveaute', label: '✨ Nouveauté' },
  { value: 'evenement', label: '🎉 Événement' },
];

export const POST_TYPE_META: Record<PostType, { label: string; color: string }> = {
  annonce: { label: '📢 Annonce', color: '#378ADD' },
  promo: { label: '🏷️ Promo', color: '#f4a61d' },
  nouveaute: { label: '✨ Nouveauté', color: '#1D9E75' },
  evenement: { label: '🎉 Événement', color: '#7F77DD' },
};

export function formatPostDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
