export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export type BookingRow = {
  id: string;
  shop_id: string;
  owner_id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  date: string;
  time_slot: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
};

export const BOOKING_STATUS_META: Record<BookingStatus, { label: string; color: string; background: string; border: string }> = {
  pending: {
    label: 'En attente',
    color: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.35)',
  },
  confirmed: {
    label: 'Confirmée',
    color: '#4ade80',
    background: 'rgba(74, 222, 128, 0.15)',
    border: 'rgba(74, 222, 128, 0.35)',
  },
  cancelled: {
    label: 'Annulée',
    color: '#f87171',
    background: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
};

export function formatBookingDateTime(date: string, timeSlot: string): string {
  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)} à ${timeSlot}`;
}
