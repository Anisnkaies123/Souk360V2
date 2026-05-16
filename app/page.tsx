'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ShopCard from '@/components/ShopCard';
import { CATEGORIES } from '@/lib/data';
import { fetchApprovedShops, fetchPublicStats } from '@/lib/shops';
import type { Shop } from '@/lib/data';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [stats, setStats] = useState({ shopCount: 0, reviewCount: 0, categoryCount: CATEGORIES.length });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [list, counts] = await Promise.all([fetchApprovedShops(), fetchPublicStats()]);
        if (!cancelled) {
          setShops(list);
          setStats({
            shopCount: counts.shopCount,
            reviewCount: counts.reviewCount,
            categoryCount: CATEGORIES.length,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/search');
    }
  }

  const featuredShops = shops.slice(0, 4);
  const recentShops = shops.length > 4 ? shops.slice(4, 12) : [];

  const STATS = [
    { value: String(stats.shopCount), label: 'Commerces', icon: '🏪' },
    { value: String(stats.categoryCount), label: 'Catégories', icon: '🗂️' },
    { value: String(stats.reviewCount), label: 'Avis', icon: '⭐' },
  ];

  return (
    <main>
      <section
        style={{
          background: 'linear-gradient(160deg, #0a1f3c 0%, #0f2d56 50%, #163660 100%)',
          padding: '80px 16px 60px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(55,138,221,0.12) 0%, transparent 70%)',
          }}
        />

        <div style={{ position: 'relative', maxWidth: '700px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(55,138,221,0.12)',
              border: '1px solid rgba(55,138,221,0.3)',
              borderRadius: '20px',
              padding: '0.35rem 1rem',
              marginBottom: '1.5rem',
              color: '#5ba0e8',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            📍 Bizerte, Tunisie
          </div>

          <h1
            style={{
              fontWeight: 900,
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#f0f4f8',
              margin: '0 0 1rem',
            }}
          >
            Découvrez{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #378ADD, #5ba0e8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Bizerte
            </span>
          </h1>

          <p
            style={{
              color: '#94b4d4',
              fontSize: 'clamp(1rem, 2vw, 1.125rem)',
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}
          >
            Trouvez les meilleurs commerces, artisans et services de votre ville en un instant.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#5a7fa8',
                  fontSize: '1.1rem',
                }}
              >
                🔍
              </span>
              <input
                className="input"
                type="text"
                placeholder="Chercher un commerce, artisan…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ paddingLeft: '42px', height: '50px', fontSize: '1rem' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ height: '50px', whiteSpace: 'nowrap', fontSize: '0.9375rem' }}>
              Rechercher
            </button>
          </form>
        </div>
      </section>

      <section style={{ background: '#0f2d56', borderBottom: '1px solid #1e4a7a' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {STATS.map((stat, i) => (
              <div
                key={i}
                style={{
                  padding: '1.5rem 1rem',
                  textAlign: 'center',
                  borderRight: i < STATS.length - 1 ? '1px solid #1e4a7a' : 'none',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.75rem', color: '#378ADD', lineHeight: 1 }}>
                  {loading ? '…' : stat.value}
                </div>
                <div style={{ color: '#94b4d4', fontSize: '0.875rem', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '48px 16px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.375rem', color: '#f0f4f8', margin: 0 }}>Catégories</h2>
          <Link href="/search" style={{ color: '#378ADD', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
            Voir tout →
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={`/search?category=${cat.value}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.625rem 1.25rem',
                borderRadius: '100px',
                background: '#0f2d56',
                border: '1.5px solid #1e4a7a',
                color: '#94b4d4',
                fontWeight: 600,
                fontSize: '0.9375rem',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      <section style={{ padding: '0 16px 64px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.375rem', color: '#f0f4f8', margin: 0 }}>Commerces en vedette</h2>
          <Link href="/search" style={{ color: '#378ADD', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
            Voir tout →
          </Link>
        </div>

        {loading ? (
          <p style={{ color: '#94b4d4', textAlign: 'center', padding: '2rem' }}>Chargement des commerces…</p>
        ) : featuredShops.length === 0 ? (
          <p style={{ color: '#94b4d4', textAlign: 'center', padding: '2rem' }}>
            Aucun commerce approuvé pour le moment. Revenez bientôt ou inscrivez le vôtre !
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {featuredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </section>

      {recentShops.length > 0 ? (
        <section style={{ padding: '0 16px 64px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.375rem', color: '#f0f4f8', margin: 0 }}>Récemment ajoutés</h2>
            <Link href="/search" style={{ color: '#378ADD', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
              Voir tout →
            </Link>
          </div>
          <p style={{ color: '#5a7fa8', fontSize: '0.875rem', margin: '-0.75rem 0 1.25rem' }}>
            Derniers commerces validés sur Souk360 ({stats.shopCount} au total dans la base).
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {recentShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </section>
      ) : null}

      <section style={{ padding: '0 16px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0f2d56, #163660)',
            border: '1px solid #1e4a7a',
            borderRadius: '16px',
            padding: 'clamp(2rem, 5vw, 3rem)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(55,138,221,0.08) 0%, transparent 70%)',
            }}
          />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏪</div>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#f0f4f8', margin: '0 0 0.75rem' }}>
              Ajouter mon commerce
            </h2>
            <p style={{ color: '#94b4d4', fontSize: '1rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 1.75rem' }}>
              Rejoignez des centaines de commerçants bizertins et touchez plus de clients locaux gratuitement.
            </p>
            <Link href="/add-shop" className="btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
              Inscrire mon commerce gratuitement →
            </Link>
          </div>
        </div>
      </section>

      <footer
        style={{
          background: '#050f1e',
          borderTop: '1px solid #1e4a7a',
          padding: '2rem 16px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontWeight: 800, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            <span style={{ color: '#f0f4f8' }}>Souk</span>
            <span style={{ color: '#378ADD' }}>360</span>
          </div>
          <p style={{ color: '#5a7fa8', fontSize: '0.875rem', margin: 0 }}>
            © 2026 Souk360 · L&apos;annuaire des commerces de Bizerte
          </p>
        </div>
      </footer>
    </main>
  );
}
