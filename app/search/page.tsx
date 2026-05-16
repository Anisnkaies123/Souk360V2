'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ShopCard from '@/components/ShopCard';
import { CATEGORIES } from '@/lib/data';
import type { Shop } from '@/lib/data';
import { fetchApprovedShops } from '@/lib/shops';

function SearchInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [minRating, setMinRating] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(5);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await fetchApprovedShops();
      if (!cancelled) {
        setShops(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || '');
  }, [searchParams]);

  /** Ancienne valeur 4.5★ retirée — ramener sur 4★ si besoin */
  useEffect(() => {
    setMinRating((m) => (m === 4.5 ? 4 : m));
  }, []);

  const filtered = shops.filter((shop) => {
    const matchesQuery =
      query.trim() === '' ||
      shop.name.toLowerCase().includes(query.toLowerCase()) ||
      shop.category.toLowerCase().includes(query.toLowerCase()) ||
      shop.categorySlug.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory === '' || shop.categorySlug === selectedCategory;
    const matchesRating = shop.rating >= minRating;
    const matchesOpen = !openOnly || shop.isOpen;
    return matchesQuery && matchesCategory && matchesRating && matchesOpen;
  });

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#f0f4f8', margin: '0 0 0.5rem' }}>
          Rechercher un commerce
        </h1>
        <p style={{ color: '#94b4d4', margin: 0 }}>
          {loading ? 'Chargement…' : `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''} trouvé${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <aside
          style={{
            width: '280px',
            flexShrink: 0,
            display: 'none',
          }}
          className="md-sidebar"
        >
          <FilterSidebar
            query={query}
            setQuery={setQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            minRating={minRating}
            setMinRating={setMinRating}
            openOnly={openOnly}
            setOpenOnly={setOpenOnly}
            maxDistance={maxDistance}
            setMaxDistance={setMaxDistance}
          />
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5a7fa8' }}>
                🔍
              </span>
              <input
                className="input"
                type="text"
                placeholder="Nom, catégorie…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '100px',
                border: '1.5px solid',
                borderColor: selectedCategory === '' ? '#378ADD' : '#1e4a7a',
                background: selectedCategory === '' ? 'rgba(55,138,221,0.12)' : '#0f2d56',
                color: selectedCategory === '' ? '#378ADD' : '#94b4d4',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Tout
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat.value ? '' : cat.value)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '100px',
                  border: '1.5px solid',
                  borderColor: selectedCategory === cat.value ? '#378ADD' : '#1e4a7a',
                  background: selectedCategory === cat.value ? 'rgba(55,138,221,0.12)' : '#0f2d56',
                  color: selectedCategory === cat.value ? '#378ADD' : '#94b4d4',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#94b4d4', fontSize: '0.875rem', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                style={{ accentColor: '#378ADD', width: '16px', height: '16px' }}
              />
              Ouvert maintenant
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#94b4d4', fontSize: '0.875rem', fontWeight: 500 }}>Note min :</span>
              {[0, 3, 4].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMinRating(r)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: minRating === r ? '#378ADD' : '#1e4a7a',
                    background: minRating === r ? 'rgba(55,138,221,0.12)' : '#0f2d56',
                    color: minRating === r ? '#378ADD' : '#5a7fa8',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {r === 0 ? 'Toutes' : `${r}★+`}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#94b4d4', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Distance : {maxDistance} km
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                style={{ accentColor: '#378ADD', width: '80px' }}
              />
            </div>
          </div>

          {loading ? (
            <p style={{ color: '#94b4d4', textAlign: 'center', padding: '3rem' }}>Chargement…</p>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                background: '#0f2d56',
                borderRadius: '12px',
                border: '1px solid #1e4a7a',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ color: '#f0f4f8', fontWeight: 700 }}>Aucun résultat</h3>
              <p style={{ color: '#94b4d4' }}>Essayez de modifier vos filtres ou votre recherche.</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filtered.map((shop) => (
                <ShopCard key={shop.id} shop={shop} showDistance />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

type FilterProps = {
  query: string;
  setQuery: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  openOnly: boolean;
  setOpenOnly: (v: boolean) => void;
  maxDistance: number;
  setMaxDistance: (v: number) => void;
};

function FilterSidebar({ openOnly, setOpenOnly, minRating, setMinRating, maxDistance, setMaxDistance }: FilterProps) {
  return (
    <div style={{ background: '#0f2d56', border: '1px solid #1e4a7a', borderRadius: '12px', padding: '1.25rem', position: 'sticky', top: '80px' }}>
      <h3 style={{ fontWeight: 700, color: '#f0f4f8', margin: '0 0 1.25rem', fontSize: '1rem' }}>Filtres</h3>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
            style={{ accentColor: '#378ADD', width: '18px', height: '18px' }}
          />
          <span style={{ color: '#94b4d4', fontWeight: 500 }}>Ouvert maintenant</span>
        </label>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <p className="label">Note minimale</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[{ v: 0, l: 'Toutes les notes' }, { v: 3, l: '3★ et plus' }, { v: 4, l: '4★ et plus' }].map(({ v, l }) => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="radio" checked={minRating === v} onChange={() => setMinRating(v)} style={{ accentColor: '#378ADD' }} />
              <span style={{ color: '#94b4d4', fontSize: '0.875rem' }}>{l}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Distance maximale : {maxDistance} km</p>
        <input
          type="range"
          min={1}
          max={10}
          value={maxDistance}
          onChange={(e) => setMaxDistance(Number(e.target.value))}
          style={{ accentColor: '#378ADD', width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5a7fa8', fontSize: '0.75rem', marginTop: '4px' }}>
          <span>1 km</span>
          <span>10 km</span>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px', color: '#94b4d4' }}>
          Chargement…
        </main>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
