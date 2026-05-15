'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
  }

  const links = [
    { href: '/', label: 'Accueil' },
    { href: '/search', label: 'Rechercher' },
    { href: '/add-shop', label: 'Ajouter' },
  ];

  return (
    <nav style={{ background: '#0a1f3c', borderBottom: '1px solid #1e4a7a' }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div
              style={{
                background: 'linear-gradient(135deg, #378ADD, #5ba0e8)',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              🧭
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
              <span style={{ color: '#f0f4f8' }}>Souk</span>
              <span style={{ color: '#378ADD' }}>360</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  color: pathname === link.href ? '#378ADD' : '#94b4d4',
                  background: pathname === link.href ? 'rgba(55,138,221,0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="btn-outline"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
              >
                Déconnexion
              </button>
            ) : (
              <Link href="/login" className="btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                Connexion
              </Link>
            )}
            <Link href="/add-shop" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              + Ajouter
            </Link>
          </div>

          <button
            className="md:hidden"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94b4d4', fontSize: '1.5rem', padding: '0.25rem' }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div style={{ background: '#0f2d56', borderTop: '1px solid #1e4a7a' }} className="md:hidden px-4 pb-4 pt-2">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 500,
                  color: pathname === link.href ? '#378ADD' : '#94b4d4',
                  background: pathname === link.href ? 'rgba(55,138,221,0.1)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="btn-outline"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.875rem' }}
                >
                  Déconnexion
                </button>
              ) : (
                <Link
                  href="/login"
                  className="btn-outline"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.875rem' }}
                  onClick={() => setMenuOpen(false)}
                >
                  Connexion
                </Link>
              )}
              <Link
                href="/add-shop"
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.875rem' }}
                onClick={() => setMenuOpen(false)}
              >
                + Ajouter
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
