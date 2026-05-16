'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Shop } from '@/lib/data';
import PhotoLightbox from '@/components/PhotoLightbox';
import { fetchApprovedShopById, fetchReviewsForShop, type ReviewWithAuthor } from '@/lib/shops';

const JS_WEEKDAY_TO_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;

function waDigits(shop: Shop): string {
  return (shop.whatsapp || shop.phone || '').replace(/\D/g, '');
}

function StarBreakdown({ reviews }: { reviews: ReviewWithAuthor[] }) {
  const total = reviews.length;
  if (total === 0) return null;
  const byStar = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <p style={{ color: '#5a7fa8', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Répartition des notes
      </p>
      {byStar.map(({ stars, count }) => (
        <div
          key={stars}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px',
          }}
        >
          <span style={{ width: '52px', color: '#94b4d4', fontSize: '0.85rem', flexShrink: 0 }}>
            {stars} ★
          </span>
          <div
            style={{
              flex: 1,
              height: '10px',
              background: '#1e4a7a',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${total ? Math.round((count / total) * 100) : 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f4a61d, #eab308)',
                borderRadius: '6px',
                transition: 'width 0.25s ease',
              }}
            />
          </div>
          <span style={{ width: '28px', textAlign: 'right', color: '#5a7fa8', fontSize: '0.8rem', flexShrink: 0 }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ShopProfilePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const [shop, setShop] = useState<Shop | null>(null);
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const todayFr = JS_WEEKDAY_TO_FR[new Date().getDay()];

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [s, r] = await Promise.all([fetchApprovedShopById(id), fetchReviewsForShop(id)]);
      if (!cancelled) {
        setShop(s);
        setReviews(r);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const fullStars = shop ? Math.floor(shop.rating) : 0;
  const emptyStars = shop ? 5 - fullStars : 0;
  const wa = shop ? waDigits(shop) : '';

  if (loading) {
    return (
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 16px', textAlign: 'center', color: '#94b4d4' }}>
        Chargement…
      </main>
    );
  }

  if (!shop) {
    return (
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem' }}>🏪</div>
        <h1 style={{ color: '#f0f4f8', fontWeight: 700 }}>Commerce introuvable</h1>
        <p style={{ color: '#94b4d4' }}>Ce commerce n&apos;existe pas ou n&apos;est pas encore approuvé.</p>
        <Link href="/search" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1rem' }}>
          ← Retour à la recherche
        </Link>
      </main>
    );
  }

  const hoursLiveLabel = shop.isOpen ? 'Ouvert maintenant' : 'Fermé en ce moment';

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px 64px' }}>
      <Link
        href="/search"
        style={{
          color: '#94b4d4',
          textDecoration: 'none',
          fontSize: '0.875rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '1.5rem',
        }}
      >
        ← Retour aux résultats
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div
          style={{
            background: '#0f2d56',
            border: '1px solid #1e4a7a',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
            <img src={shop.photos[0]} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(10,31,60,0.95) 0%, rgba(10,31,60,0.35) 45%, transparent 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '1.25rem 1.25rem 1rem',
              }}
            >
              <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.35rem, 4vw, 1.85rem)', color: '#f0f4f8', margin: '0 0 0.65rem', lineHeight: 1.2 }}>
                {shop.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    background: 'rgba(55,138,221,0.2)',
                    border: '1px solid #378ADD',
                    color: '#94b4d4',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {shop.categoryIcon} {shop.category}
                </span>
                {shop.isVerified ? (
                  <span className="badge-verified" style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}>
                    ✓ Vérifié Souk360
                  </span>
                ) : null}
                <span className={shop.isOpen ? 'badge-open' : 'badge-closed'} style={{ fontSize: '0.75rem' }}>
                  {shop.isOpen ? '● Ouvert' : '● Fermé'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="stars" style={{ fontSize: '1.15rem', letterSpacing: '1px', color: '#f4a61d' }}>
                  {'★'.repeat(fullStars)}
                  {'☆'.repeat(emptyStars)}
                </span>
                <span style={{ fontWeight: 800, color: '#f4a61d', fontSize: '1.2rem' }}>{shop.rating}</span>
                <span style={{ color: '#5a7fa8', fontSize: '0.9rem' }}>
                  · {shop.reviewCount} avis {shop.reviewCount === 1 ? 'client' : 'clients'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.25rem 1.25rem 1.5rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: wa ? '1fr 1fr' : '1fr',
                gap: '12px',
                marginBottom: '1.25rem',
              }}
            >
              {wa ? (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                  style={{
                    fontSize: '1.05rem',
                    padding: '1rem 1.25rem',
                    justifyContent: 'center',
                    fontWeight: 700,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              ) : null}
              <a
                href={`tel:${shop.phone.replace(/\s+/g, '')}`}
                className="btn-primary"
                style={{
                  fontSize: '1.05rem',
                  padding: '1rem 1.25rem',
                  justifyContent: 'center',
                  fontWeight: 700,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                }}
              >
                📞 Appeler
              </a>
            </div>

            <p style={{ color: '#94b4d4', lineHeight: 1.75, margin: '0 0 1rem', fontSize: '0.975rem' }}>{shop.description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#94b4d4', fontSize: '0.9375rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📍</span>
                <span>{shop.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.1rem' }}>📞</span>
                <span>{shop.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {shop.videoUrl ? (
          <div
            style={{
              background: '#0f2d56',
              border: '1px solid #1e4a7a',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#f0f4f8', margin: '0 0 1rem' }}>🎬 Vidéo</h2>
            <video
              src={shop.videoUrl}
              controls
              playsInline
              style={{
                width: '100%',
                borderRadius: '10px',
                maxHeight: '420px',
                background: '#0a1f3c',
              }}
            />
          </div>
        ) : null}

        <div
          style={{
            background: '#0f2d56',
            border: '1px solid #1e4a7a',
            borderRadius: '12px',
            padding: '1.25rem',
          }}
        >
          <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#f0f4f8', margin: '0 0 0.35rem' }}>📸 Photos</h2>
          <p style={{ color: '#5a7fa8', fontSize: '0.8rem', margin: '0 0 1rem' }}>Cliquez sur une image pour l&apos;agrandir</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {shop.photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i)}
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                  border: 'none',
                  padding: 0,
                  cursor: 'zoom-in',
                  display: 'block',
                  width: '100%',
                }}
              >
                <img
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </button>
            ))}
          </div>
        </div>

        {lightboxIndex !== null ? (
          <PhotoLightbox urls={shop.photos} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        ) : null}

        <div
          style={{
            background: '#0f2d56',
            border: '1px solid #1e4a7a',
            borderRadius: '12px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h2
              style={{
                fontWeight: 700,
                fontSize: '1.125rem',
                color: '#f0f4f8',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              🕐 Horaires
            </h2>
            <span className={shop.isOpen ? 'badge-open' : 'badge-closed'} style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
              {hoursLiveLabel}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {shop.hours.map((h, i) => {
              const isToday = h.day === todayFr;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.625rem 0.875rem',
                    background: isToday ? 'rgba(55,138,221,0.12)' : '#163660',
                    borderRadius: '8px',
                    border: isToday ? '1px solid #378ADD' : '1px solid transparent',
                  }}
                >
                  <span style={{ color: isToday ? '#f0f4f8' : '#94b4d4', fontWeight: isToday ? 700 : 500 }}>
                    {h.day}
                    {isToday ? ' · Aujourd’hui' : ''}
                  </span>
                  <span
                    style={{
                      color: h.time === 'Fermé' ? '#f87171' : '#4ade80',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    {h.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            background: '#0f2d56',
            border: '1px solid #1e4a7a',
            borderRadius: '12px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#f0f4f8', margin: 0 }}>⭐ Avis clients</h2>
            <span style={{ color: '#5a7fa8', fontSize: '0.875rem' }}>{shop.reviewCount} avis au total</span>
          </div>

          {reviews.length > 0 ? (
            <>
              <StarBreakdown reviews={reviews} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      background: '#163660',
                      border: '1px solid #1e4a7a',
                      borderRadius: '10px',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f0f4f8', fontSize: '0.9375rem' }}>{review.author}</div>
                        <div style={{ color: '#f4a61d', fontSize: '0.875rem' }}>
                          {'★'.repeat(review.rating)}
                          {'☆'.repeat(5 - review.rating)}
                        </div>
                      </div>
                      <span style={{ color: '#5a7fa8', fontSize: '0.8rem' }}>
                        {new Date(review.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ color: '#94b4d4', margin: 0, lineHeight: 1.6, fontSize: '0.9rem' }}>{review.comment}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: '#5a7fa8', textAlign: 'center', padding: '2rem 0' }}>Soyez le premier à laisser un avis !</p>
          )}
        </div>
      </div>
    </main>
  );
}
