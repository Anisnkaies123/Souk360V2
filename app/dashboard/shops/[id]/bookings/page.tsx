'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { BOOKING_STATUS_META, formatBookingDateTime, type BookingRow, type BookingStatus } from '@/lib/bookings';
import { supabase } from '@/lib/supabase';

type Filter = 'all' | BookingStatus;

type Shop = {
  id: string;
  name: string;
  owner_id: string;
};

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'cancelled', label: 'Annulées' },
];

function emptyText(filter: Filter): string {
  if (filter === 'pending') return 'Aucune réservation en attente.';
  if (filter === 'confirmed') return 'Aucune réservation confirmée.';
  if (filter === 'cancelled') return 'Aucune réservation annulée.';
  return 'Aucune réservation pour le moment.';
}

export default function ShopBookingsPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadBookings() {
    if (!shopId) return;

    const { data, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('shop_id', shopId)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (bookingsError) {
      setError('Impossible de charger les réservations. Veuillez réessayer.');
      console.error('Bookings fetch error:', bookingsError);
      return;
    }

    setBookings((data as BookingRow[]) ?? []);
  }

  useEffect(() => {
    async function loadPage() {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !currentUser) {
        router.replace('/login');
        return;
      }

      setUser(currentUser);
      setAuthChecked(true);

      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, name, owner_id')
        .eq('id', shopId)
        .single();

      if (shopError || !shopData) {
        setError('Commerce introuvable.');
        setLoading(false);
        return;
      }

      if (shopData.owner_id !== currentUser.id) {
        router.replace('/dashboard');
        return;
      }

      setShop(shopData as Shop);
      await loadBookings();
      setLoading(false);
    }

    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, shopId]);

  const stats = useMemo(
    () => ({
      pending: bookings.filter((booking) => booking.status === 'pending').length,
      confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
      cancelled: bookings.filter((booking) => booking.status === 'cancelled').length,
    }),
    [bookings],
  );

  const visibleBookings = filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter);

  async function updateStatus(booking: BookingRow, status: BookingStatus) {
    if (!user) return;

    setSavingId(booking.id);
    setError('');
    setSuccess('');

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', booking.id)
      .eq('owner_id', user.id);

    setSavingId(null);

    if (updateError) {
      setError('Impossible de mettre à jour cette réservation. Veuillez réessayer.');
      console.error('Booking update error:', updateError);
      return;
    }

    setSuccess(status === 'confirmed' ? 'Réservation confirmée ✓' : 'Réservation annulée ✓');
    await loadBookings();
  }

  if (!authChecked || loading) {
    return (
      <main style={{ maxWidth: '920px', margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: '#94b4d4' }}>
        Chargement des réservations…
      </main>
    );
  }

  if (error && !shop) {
    return (
      <main style={{ maxWidth: '920px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#f87171', fontSize: '1.125rem', marginBottom: '1.5rem' }}>{error}</p>
        <Link href="/dashboard" className="btn-primary">
          Retour au dashboard
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '920px', margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#94b4d4',
            fontSize: '0.875rem',
            textDecoration: 'none',
            marginBottom: '1rem',
          }}
        >
          ← Retour au dashboard
        </Link>
        <h1 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#f0f4f8', margin: '0 0 0.35rem' }}>
          Réservations — {shop?.name}
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.35rem' }}>{stats.pending}</div>
          <div style={{ color: '#94b4d4', fontSize: '0.875rem' }}>En attente</div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4ade80', marginBottom: '0.35rem' }}>{stats.confirmed}</div>
          <div style={{ color: '#94b4d4', fontSize: '0.875rem' }}>Confirmées</div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f87171', marginBottom: '0.35rem' }}>{stats.cancelled}</div>
          <div style={{ color: '#94b4d4', fontSize: '0.875rem' }}>Annulées</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={filter === item.value ? 'btn-primary' : 'btn-outline'}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.875rem' }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {success ? (
        <div
          style={{
            background: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid rgba(74, 222, 128, 0.35)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1rem',
            color: '#4ade80',
            fontWeight: 700,
          }}
        >
          {success}
        </div>
      ) : null}

      {error ? <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p> : null}

      {visibleBookings.length === 0 ? (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94b4d4' }}>
          {emptyText(filter)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {visibleBookings.map((booking) => {
            const meta = BOOKING_STATUS_META[booking.status] ?? BOOKING_STATUS_META.pending;
            const isSaving = savingId === booking.id;

            return (
              <article key={booking.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: '#f0f4f8', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.6rem' }}>
                      {formatBookingDateTime(booking.date, booking.time_slot)}
                    </div>
                    <div style={{ color: '#94b4d4', lineHeight: 1.6 }}>
                      <strong style={{ color: '#f0f4f8' }}>{booking.client_name}</strong>
                      <span> · {booking.client_phone}</span>
                    </div>
                    {booking.notes ? (
                      <p style={{ color: '#5a7fa8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0.55rem 0 0' }}>
                        {booking.notes}
                      </p>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        borderRadius: '999px',
                        padding: '0.25rem 0.7rem',
                        background: meta.background,
                        border: `1px solid ${meta.border}`,
                        color: meta.color,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {meta.label}
                    </span>

                    {booking.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => updateStatus(booking, 'confirmed')}
                          disabled={isSaving}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}
                        >
                          ✓ Confirmer
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => updateStatus(booking, 'cancelled')}
                          disabled={isSaving}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.45)' }}
                        >
                          ✗ Annuler
                        </button>
                      </div>
                    ) : null}

                    {booking.status === 'confirmed' ? (
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => updateStatus(booking, 'cancelled')}
                        disabled={isSaving}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.45)' }}
                      >
                        Annuler
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
