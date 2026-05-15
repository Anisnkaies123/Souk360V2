import Link from 'next/link';
import { Shop } from '@/lib/data';
import { PLACEHOLDER_SHOP_IMAGE } from '@/lib/shops';

type Props = {
  shop: Shop;
  showDistance?: boolean;
};

function waDigits(shop: Shop): string {
  return (shop.whatsapp || shop.phone || '').replace(/\D/g, '');
}

export default function ShopCard({ shop, showDistance = false }: Props) {
  const fullStars = Math.floor(shop.rating);
  const emptyStars = 5 - fullStars;
  const cover = shop.photos[0] || PLACEHOLDER_SHOP_IMAGE;
  const wa = waDigits(shop);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Photo */}
      <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
        <img
          src={cover}
          alt={shop.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{
            background: 'rgba(10,31,60,0.85)',
            backdropFilter: 'blur(4px)',
            border: '1px solid #1e4a7a',
            color: '#94b4d4',
            padding: '0.2rem 0.5rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            {shop.categoryIcon} {shop.category}
          </span>
        </div>
        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
          <span className={shop.isOpen ? 'badge-open' : 'badge-closed'}>
            {shop.isOpen ? '● Ouvert' : '● Fermé'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem' }}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#f0f4f8', margin: 0, lineHeight: 1.3 }}>
              {shop.name}
            </h3>
            {shop.isVerified && (
              <span className="badge-verified" style={{ display: 'inline-block', marginTop: '4px' }}>
                ✓ Vérifié
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <span className="stars" style={{ fontSize: '0.85rem' }}>
            {'★'.repeat(fullStars)}{'☆'.repeat(emptyStars)}
          </span>
          <span style={{ fontWeight: 700, color: '#f4a61d', fontSize: '0.875rem' }}>{shop.rating}</span>
          <span style={{ color: '#5a7fa8', fontSize: '0.8rem' }}>({shop.reviewCount} avis)</span>
          {showDistance && shop.distance && (
            <span style={{ color: '#5a7fa8', fontSize: '0.8rem', marginLeft: 'auto' }}>
              📍 {shop.distance}
            </span>
          )}
        </div>

        {/* Address */}
        <p style={{ color: '#94b4d4', fontSize: '0.8125rem', margin: '0.5rem 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
          📍 {shop.address}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {wa ? (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          ) : null}
          <Link
            href={`/shop/${shop.id}`}
            className="btn-outline"
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
          >
            Voir →
          </Link>
        </div>
      </div>
    </div>
  );
}
