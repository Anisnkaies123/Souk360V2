'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { CATEGORIES } from '@/lib/data';
import { supabase } from '@/lib/supabase';

type Profile = {
  id: string;
  full_name?: string;
  email?: string;
};

type OwnerShop = {
  id: string;
  name: string;
  category: string;
  is_approved: boolean;
  is_verified: boolean;
  created_at: string;
  photos: string[];
  description: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [shops, setShops] = useState<OwnerShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
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

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch shops
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('id, name, category, is_approved, is_verified, created_at, photos, description')
        .eq('owner_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (shopsError) {
        setError('Impossible de charger vos commerces. Veuillez réessayer.');
        console.error('Shops fetch error:', shopsError);
      } else {
        setShops((shopsData as OwnerShop[]) ?? []);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  function categoryLabel(slug: string): string {
    return CATEGORIES.find((c) => c.value === slug)?.label ?? slug;
  }

  function categoryIcon(slug: string): string {
    return CATEGORIES.find((c) => c.value === slug)?.icon ?? '🏪';
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const totalShops = shops.length;
  const publishedShops = shops.filter((s) => s.is_approved).length;
  const pendingShops = shops.filter((s) => !s.is_approved).length;

  if (!authChecked || loading) {
    return (
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: '#94b4d4' }}>
        Chargement de vos commerces…
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#f87171', fontSize: '1.125rem', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => router.refresh()} className="btn-primary">
          Réessayer
        </button>
      </main>
    );
  }

  const displayName = profile?.full_name || user?.email || 'Utilisateur';

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px 64px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#f0f4f8', margin: '0 0 0.35rem' }}>
            Bonjour, {displayName}
          </h1>
          <p style={{ color: '#94b4d4', margin: 0 }}>Gérez vos commerces sur Souk360</p>
        </div>
        <Link href="/add-shop" className="btn-primary">
          + Ajouter un commerce
        </Link>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '2.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#378ADD', marginBottom: '0.5rem' }}>{totalShops}</div>
          <div style={{ color: '#94b4d4', fontSize: '0.875rem' }}>Total boutiques</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4ade80', marginBottom: '0.5rem' }}>{publishedShops}</div>
          <div style={{ color: '#94b4d4', fontSize: '0.875rem' }}>Publiées</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.5rem' }}>{pendingShops}</div>
          <div style={{ color: '#94b4d4', fontSize: '0.875rem' }}>En attente</div>
        </div>
      </div>

      {/* Empty State */}
      {shops.length === 0 ? (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏪</div>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#f0f4f8', margin: '0 0 0.75rem' }}>
            Vous n'avez pas encore de commerce sur Souk360.
          </h2>
          <Link href="/add-shop" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1.5rem' }}>
            Ajouter mon premier commerce
          </Link>
        </div>
      ) : (
        /* Shops List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {shops.map((shop) => (
            <div key={shop.id} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              {/* Shop Photo */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#163660',
                  flexShrink: 0,
                  border: '1px solid #1e4a7a',
                }}
              >
                {shop.photos && shop.photos.length > 0 ? (
                  <img
                    src={shop.photos[0]}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                    }}
                  >
                    🏪
                  </div>
                )}
              </div>

              {/* Shop Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#f0f4f8', margin: 0 }}>
                    {shop.name}
                  </h3>
                  {shop.is_approved ? (
                    <span className="badge-open" style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}>
                      Publié
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        background: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.35)',
                        color: '#fbbf24',
                      }}
                    >
                      En attente de validation
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#94b4d4', fontSize: '0.875rem' }}>
                  <span>{categoryIcon(shop.category)}</span>
                  <span>{categoryLabel(shop.category)}</span>
                </div>
                <p style={{ color: '#5a7fa8', fontSize: '0.8125rem', margin: 0 }}>
                  Ajouté le {formatDate(shop.created_at)}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                <Link
                  href={`/shop/${shop.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                  style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}
                >
                  Voir la boutique
                </Link>
                <Link
                  href={`/dashboard/shops/${shop.id}/edit`}
                  className="btn-outline"
                  style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}
                >
                  Modifier
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
