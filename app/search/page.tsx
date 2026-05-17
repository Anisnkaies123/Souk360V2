'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ShopCard from '@/components/ShopCard';
import { CATEGORIES, type Shop } from '@/lib/data';
import { fetchApprovedShops } from '@/lib/shops';

const BIZERTE_CENTER: [number, number] = [37.2746, 9.8739];

type LeafletWindow = Window & {
  L?: any;
  __leafletLoad?: Promise<any>;
};

function ensureLeafletCss() {
  if (document.getElementById('leaflet-css')) return;

  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

function loadLeaflet(): Promise<any> {
  const win = window as LeafletWindow;
  ensureLeafletCss();

  if (win.L) return Promise.resolve(win.L);
  if (win.__leafletLoad) return win.__leafletLoad;

  win.__leafletLoad = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-leaflet-script="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(win.L));
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.dataset.leafletScript = 'true';
    script.onload = () => resolve(win.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return win.__leafletLoad;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function pinIcon(L: any, highlighted: boolean) {
  const size = highlighted ? 26 : 20;
  const color = highlighted ? '#f4a61d' : '#378ADD';
  const dot = highlighted ? 9 : 7;

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:999px;
        background:${color};
        border:2px solid #ffffff;
        box-shadow:0 8px 18px rgba(10,31,60,0.35);
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <span style="
          width:${dot}px;
          height:${dot}px;
          border-radius:999px;
          background:#ffffff;
          display:block;
        "></span>
      </div>
    `,
  });
}

function popupHtml(shop: Shop): string {
  const stars = '★'.repeat(Math.floor(shop.rating)) + '☆'.repeat(5 - Math.floor(shop.rating));
  return `
    <div style="min-width:180px;color:#0a1f3c">
      <strong style="display:block;font-size:0.95rem;margin-bottom:4px">${escapeHtml(shop.name)}</strong>
      <div style="font-size:0.82rem;margin-bottom:6px">${escapeHtml(`${shop.categoryIcon} ${shop.category}`)}</div>
      <div style="font-size:0.82rem;color:#6b7280;margin-bottom:8px">
        <span style="color:#f4a61d">${stars}</span>
        <strong style="color:#f4a61d">${shop.rating}</strong>
        <span>(${shop.reviewCount} avis)</span>
      </div>
      <a href="/shop/${shop.id}" style="color:#378ADD;font-weight:700;text-decoration:none">Voir la boutique →</a>
    </div>
  `;
}

type ShopMapProps = {
  shops: Shop[];
  highlightedShopId: string | null;
  selectedShopId: string | null;
  onPinHover: (shopId: string | null) => void;
  onPinClick: (shopId: string) => void;
};

function ShopMap({ shops, highlightedShopId, selectedShopId, onPinHover, onPinClick }: ShopMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapContainerRef.current || mapRef.current) return;

        leafletRef.current = L;
        const map = L.map(mapContainerRef.current, {
          center: BIZERTE_CENTER,
          zoom: 13,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        mapRef.current = map;
        setMapLoaded(true);
        setTimeout(() => map.invalidateSize(), 0);
      })
      .catch((error) => {
        console.error('Leaflet load error:', error);
        setMapError("Impossible de charger la carte pour le moment.");
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !mapLoaded) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    shops.forEach((shop) => {
      const lat = shop.lat ?? BIZERTE_CENTER[0];
      const lng = shop.lng ?? BIZERTE_CENTER[1];
      const highlighted = highlightedShopId === shop.id;
      const marker = L.marker([lat, lng], {
        icon: pinIcon(L, highlighted),
        zIndexOffset: highlighted ? 1000 : 0,
      })
        .addTo(map)
        .bindPopup(popupHtml(shop));

      marker.on('mouseover', () => onPinHover(shop.id));
      marker.on('mouseout', () => onPinHover(null));
      marker.on('click', () => {
        onPinClick(shop.id);
        marker.openPopup();
      });

      markersRef.current[shop.id] = marker;
    });
  }, [shops, highlightedShopId, onPinClick, onPinHover, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = selectedShopId ? markersRef.current[selectedShopId] : null;
    if (!map || !marker) return;

    marker.openPopup();
    map.panTo(marker.getLatLng(), { animate: true });
  }, [selectedShopId, shops, highlightedShopId]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', background: '#0a1f3c' }}>
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
      {mapError ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94b4d4',
            background: '#0a1f3c',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          {mapError}
        </div>
      ) : null}
    </div>
  );
}

function SearchInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [minRating, setMinRating] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(5);
  const [mapReady, setMapReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'list' | 'map'>('list');
  const [hoveredShopId, setHoveredShopId] = useState<string | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  useEffect(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    const updateMobileState = () => setIsMobile(window.innerWidth < 768);
    updateMobileState();
    window.addEventListener('resize', updateMobileState);
    return () => window.removeEventListener('resize', updateMobileState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchApprovedShops();
        if (!cancelled) {
          setShops(list);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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

  /** Ancienne valeur 4.5★ retirée, ramener sur 4★ si besoin. */
  useEffect(() => {
    setMinRating((m) => (m === 4.5 ? 4 : m));
  }, []);

  const filtered = useMemo(
    () =>
      shops.filter((shop) => {
        const normalizedQuery = query.trim().toLowerCase();
        const matchesQuery =
          normalizedQuery === '' ||
          shop.name.toLowerCase().includes(normalizedQuery) ||
          shop.category.toLowerCase().includes(normalizedQuery) ||
          shop.categorySlug.toLowerCase().includes(normalizedQuery);
        const matchesCategory = selectedCategory === '' || shop.categorySlug === selectedCategory;
        const matchesRating = shop.rating >= minRating;
        const matchesOpen = !openOnly || shop.isOpen;
        return matchesQuery && matchesCategory && matchesRating && matchesOpen;
      }),
    [shops, query, selectedCategory, minRating, openOnly],
  );

  const highlightedShopId = hoveredShopId || selectedShopId;
  const showList = !isMobile || activeMobileTab === 'list';
  const showMap = !isMobile || activeMobileTab === 'map';

  useEffect(() => {
    if (!highlightedShopId || !isMobile || activeMobileTab !== 'list') return;
    cardRefs.current[highlightedShopId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [highlightedShopId, isMobile, activeMobileTab]);

  function handleShopClick(shopId: string) {
    setSelectedShopId(shopId);
    if (isMobile) setActiveMobileTab('map');
  }

  const controls = (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#f0f4f8', margin: '0 0 0.4rem' }}>
          Rechercher un commerce
        </h1>
        <p style={{ color: '#94b4d4', margin: 0 }}>
          {loading ? 'Chargement…' : `${filtered.length} commerce${filtered.length !== 1 ? 's' : ''} trouvé${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
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

      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#94b4d4', fontSize: '0.875rem', fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
            style={{ accentColor: '#378ADD', width: '16px', height: '16px' }}
          />
          Ouvert maintenant
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
    </>
  );

  return (
    <main style={{ height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#0a1f3c' }}>
      {isMobile ? (
        <div style={{ display: 'flex', gap: '8px', padding: '12px', borderBottom: '1px solid #1e4a7a', background: '#0a1f3c' }}>
          <button
            type="button"
            onClick={() => setActiveMobileTab('list')}
            className={activeMobileTab === 'list' ? 'btn-primary' : 'btn-outline'}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('map')}
            className={activeMobileTab === 'map' ? 'btn-primary' : 'btn-outline'}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Carte
          </button>
        </div>
      ) : null}

      <div style={{ display: isMobile ? 'block' : 'flex', height: isMobile ? 'calc(100% - 57px)' : '100%' }}>
        {showList ? (
          <section
            style={{
              width: isMobile ? '100%' : 'min(420px, 40%)',
              height: '100%',
              overflowY: 'auto',
              padding: isMobile ? '16px' : '24px 18px 24px 24px',
              borderRight: isMobile ? 'none' : '1px solid #1e4a7a',
              background: '#0a1f3c',
            }}
          >
            {controls}

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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.map((shop) => {
                  const highlighted = highlightedShopId === shop.id;
                  return (
                    <div
                      key={shop.id}
                      ref={(node) => {
                        cardRefs.current[shop.id] = node;
                      }}
                      onMouseEnter={() => setHoveredShopId(shop.id)}
                      onMouseLeave={() => setHoveredShopId(null)}
                      onClick={() => handleShopClick(shop.id)}
                      style={{
                        border: highlighted ? '2px solid #378ADD' : '2px solid transparent',
                        borderRadius: '14px',
                        transition: 'border-color 0.15s ease, transform 0.15s ease',
                        transform: highlighted ? 'translateY(-1px)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <ShopCard shop={shop} showDistance />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {showMap ? (
          <section
            style={{
              flex: 1,
              height: '100%',
              position: isMobile ? 'relative' : 'sticky',
              top: isMobile ? 0 : '64px',
              background: '#0f2d56',
            }}
          >
            {mapReady ? (
              <ShopMap
                shops={filtered}
                highlightedShopId={highlightedShopId}
                selectedShopId={selectedShopId}
                onPinHover={setHoveredShopId}
                onPinClick={(shopId) => {
                  setSelectedShopId(shopId);
                  setHoveredShopId(shopId);
                }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94b4d4' }}>
                Chargement de la carte…
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main style={{ height: 'calc(100vh - 64px)', padding: '32px 16px', color: '#94b4d4', background: '#0a1f3c' }}>
          Chargement…
        </main>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
