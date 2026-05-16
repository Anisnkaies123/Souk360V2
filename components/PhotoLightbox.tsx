'use client';

import { useEffect, useState } from 'react';

type Props = {
  urls: string[];
  initialIndex: number;
  onClose: () => void;
};

export default function PhotoLightbox({ urls, initialIndex, onClose }: Props) {
  const [idx, setIdx] = useState(() => Math.min(Math.max(0, initialIndex), Math.max(0, urls.length - 1)));

  useEffect(() => {
    setIdx(Math.min(Math.max(0, initialIndex), Math.max(0, urls.length - 1)));
  }, [initialIndex, urls.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(urls.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, urls.length]);

  if (urls.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Galerie photo agrandie"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(5, 15, 30, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px 16px',
      }}
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '1px solid #1e4a7a',
          background: '#0f2d56',
          color: '#f0f4f8',
          fontSize: '1.5rem',
          cursor: 'pointer',
          lineHeight: 1,
          zIndex: 102,
        }}
      >
        ×
      </button>

      {urls.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Photo précédente"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => Math.max(0, i - 1));
            }}
            style={{
              position: 'fixed',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1px solid #1e4a7a',
              background: '#0f2d56',
              color: '#f0f4f8',
              fontSize: '1.25rem',
              cursor: 'pointer',
              zIndex: 102,
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Photo suivante"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => Math.min(urls.length - 1, i + 1));
            }}
            style={{
              position: 'fixed',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1px solid #1e4a7a',
              background: '#0f2d56',
              color: '#f0f4f8',
              fontSize: '1.25rem',
              cursor: 'pointer',
              zIndex: 102,
            }}
          >
            ›
          </button>
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#94b4d4',
              fontSize: '0.875rem',
              fontWeight: 600,
              zIndex: 102,
            }}
          >
            {idx + 1} / {urls.length}
          </div>
        </>
      ) : null}

      <img
        src={urls[idx]}
        alt={`Photo ${idx + 1}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '100%',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: '10px',
          border: '1px solid #1e4a7a',
        }}
      />
    </div>
  );
}
