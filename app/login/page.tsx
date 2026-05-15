'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Tab = 'login' | 'signup';

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : err.message,
      );
    } else {
      router.push(safeNextPath(searchParams.get('next')));
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
      setTab('login');
    }
  }

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg, #378ADD, #5ba0e8)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              margin: '0 auto 0.75rem',
            }}
          >
            🧭
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.5rem' }}>
            <span style={{ color: '#f0f4f8' }}>Souk</span>
            <span style={{ color: '#378ADD' }}>360</span>
          </div>
          <p style={{ color: '#94b4d4', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Connectez-vous pour gérer votre commerce
          </p>
        </div>

        <div
          style={{
            background: '#0f2d56',
            border: '1px solid #1e4a7a',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', borderBottom: '1px solid #1e4a7a' }}>
            {(['login', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setError('');
                  setSuccess('');
                }}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: tab === t ? 'rgba(55,138,221,0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: tab === t ? '2px solid #378ADD' : '2px solid transparent',
                  color: tab === t ? '#378ADD' : '#5a7fa8',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {t === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.75rem' }}>
            {success && (
              <div
                style={{
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#4ade80',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                }}
              >
                ✓ {success}
              </div>
            )}

            {error && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#f87171',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                }}
              >
                ⚠ {error}
              </div>
            )}

            <form onSubmit={tab === 'login' ? handleLogin : handleSignup}>
              {tab === 'signup' && (
                <div style={{ marginBottom: '1.1rem' }}>
                  <label className="label" htmlFor="name">
                    Nom complet
                  </label>
                  <input
                    id="name"
                    className="input"
                    type="text"
                    placeholder="Mohamed Ben Ali"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={{ marginBottom: '1.1rem' }}>
                <label className="label" htmlFor="email">
                  Adresse e-mail
                </label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.375rem',
                  }}
                >
                  <label className="label" htmlFor="password" style={{ marginBottom: 0 }}>
                    Mot de passe
                  </label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#378ADD',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  className="input"
                  type="password"
                  placeholder={tab === 'signup' ? 'Minimum 8 caractères' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  padding: '0.75rem',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '...' : tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#1e4a7a' }} />
              <span style={{ color: '#5a7fa8', fontSize: '0.8rem' }}>ou</span>
              <div style={{ flex: 1, height: '1px', background: '#1e4a7a' }} />
            </div>

            <button
              type="button"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#163660',
                border: '1.5px solid #1e4a7a',
                borderRadius: '8px',
                color: '#f0f4f8',
                fontWeight: 600,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#378ADD';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(55,138,221,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#1e4a7a';
                (e.currentTarget as HTMLButtonElement).style.background = '#163660';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuer avec Google
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#5a7fa8', fontSize: '0.8rem', marginTop: '1.25rem' }}>
          En continuant, vous acceptez les{' '}
          <span style={{ color: '#378ADD', cursor: 'pointer' }}>Conditions d&apos;utilisation</span> et la{' '}
          <span style={{ color: '#378ADD', cursor: 'pointer' }}>Politique de confidentialité</span>.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94b4d4',
          }}
        >
          Chargement…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
