'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { CATEGORIES } from '@/lib/data';
import { fetchProfileRole } from '@/lib/profile-role';
import { supabase } from '@/lib/supabase';

type AdminShopRow = {
  id: string;
  name: string;
  category: string;
  is_approved: boolean;
  created_at: string;
};

function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.value === slug)?.label ?? slug;
}

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<AdminShopRow[]>([]);
  const [stats, setStats] = useState({ totalShops: 0, pendingShops: 0, totalReviews: 0 });
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setActionError('');

    const [shopsRes, totalRes, pendingRes, reviewsRes] = await Promise.all([
      supabase.from('shops').select('id, name, category, is_approved, created_at').order('created_at', { ascending: false }),
      supabase.from('shops').select('id', { count: 'exact', head: true }),
      supabase.from('shops').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
    ]);

    if (shopsRes.error) {
      setActionError(shopsRes.error.message);
      setLoading(false);
      return;
    }

    setShops((shopsRes.data as AdminShopRow[]) ?? []);
    setStats({
      totalShops: totalRes.count ?? 0,
      pendingShops: pendingRes.count ?? 0,
      totalReviews: reviewsRes.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      const u = session?.user ?? null;
      setUser(u);
      if (!u) {
        router.replace(`/login?next=${encodeURIComponent('/admin')}`);
        setAuthChecked(true);
        return;
      }
      const role = await fetchProfileRole(u.id);
      if (cancelled) return;
      setIsAdmin(role === 'admin');
      setAuthChecked(true);
      if (role === 'admin') {
        await loadData();
      } else {
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) {
        router.replace(`/login?next=${encodeURIComponent('/admin')}`);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const role = await fetchProfileRole(u.id);
      setIsAdmin(role === 'admin');
      if (role === 'admin') {
        await loadData();
      } else {
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router, loadData]);

  async function approveShop(id: string) {
    setBusyId(id);
    setActionError('');
    const { error } = await supabase.from('shops').update({ is_approved: true }).eq('id', id);
    setBusyId(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    await loadData();
  }

  async function rejectShop(id: string) {
    if (!confirm('Refuser et supprimer définitivement ce commerce en attente ?')) return;
    setBusyId(id);
    setActionError('');
    const { error } = await supabase.from('shops').delete().eq('id', id);
    setBusyId(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    await loadData();
  }

  async function deleteShop(id: string, name: string) {
    if (!confirm(`Supprimer définitivement « ${name} » et tous ses avis ?`)) return;
    setBusyId(id);
    setActionError('');
    const { error } = await supabase.from('shops').delete().eq('id', id);
    setBusyId(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    await loadData();
  }

  if (!authChecked || (!user && loading)) {
    return (
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: '#94b4d4' }}>
        Vérification…
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <h1 style={{ color: '#f0f4f8', fontWeight: 800, marginBottom: '0.75rem' }}>Accès refusé</h1>
        <p style={{ color: '#94b4d4', lineHeight: 1.6 }}>
          Cette page est réservée aux administrateurs Souk360.
        </p>
        <Link href="/" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1.5rem' }}>
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  const pending = shops.filter((s) => !s.is_approved);

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#f0f4f8', margin: '0 0 0.35rem' }}>
          Administration Souk360
        </h1>
        <p style={{ color: '#94b4d4', margin: 0 }}>Modération des commerces — Bizerte</p>
      </div>

      {actionError ? (
        <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>{actionError}</p>
      ) : null}

      {loading ? (
        <p style={{ color: '#94b4d4' }}>Chargement du tableau de bord…</p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '2rem',
            }}
          >
            {[
              { label: 'Total commerces', value: stats.totalShops },
              { label: 'En attente de validation', value: stats.pendingShops },
              { label: 'Total avis', value: stats.totalReviews },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  background: '#0f2d56',
                  border: '1px solid #1e4a7a',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#378ADD' }}>{card.value}</div>
                <div style={{ color: '#94b4d4', fontSize: '0.875rem', marginTop: '4px' }}>{card.label}</div>
              </div>
            ))}
          </div>

          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#f0f4f8', margin: '0 0 1rem' }}>
              Commerces en attente de validation
            </h2>
            {pending.length === 0 ? (
              <p style={{ color: '#5a7fa8', background: '#163660', borderRadius: '10px', padding: '1rem' }}>
                Aucun commerce en attente.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pending.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: '#163660',
                      border: '1px solid #1e4a7a',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#f0f4f8' }}>{s.name}</div>
                      <div style={{ color: '#94b4d4', fontSize: '0.875rem' }}>
                        {categoryLabel(s.category)} ·{' '}
                        {new Date(s.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ fontSize: '0.875rem', opacity: busyId === s.id ? 0.6 : 1 }}
                        disabled={busyId === s.id}
                        onClick={() => void approveShop(s.id)}
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ fontSize: '0.875rem', borderColor: '#f87171', color: '#f87171', opacity: busyId === s.id ? 0.6 : 1 }}
                        disabled={busyId === s.id}
                        onClick={() => void rejectShop(s.id)}
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#f0f4f8', margin: '0 0 1rem' }}>
              Tous les commerces
            </h2>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #1e4a7a' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#0f2d56', color: '#94b4d4', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Commerce</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Catégorie</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Statut</th>
                    <th style={{ padding: '0.75rem 1rem', width: '100px' }} />
                  </tr>
                </thead>
                <tbody>
                  {shops.map((s) => (
                    <tr key={s.id} style={{ borderTop: '1px solid #1e4a7a', background: '#163660' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#f0f4f8', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#94b4d4' }}>{categoryLabel(s.category)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ color: s.is_approved ? '#4ade80' : '#fbbf24', fontWeight: 600 }}>
                          {s.is_approved ? 'Publié' : 'En attente'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.35rem 0.65rem',
                            borderColor: '#f87171',
                            color: '#f87171',
                          }}
                          disabled={busyId === s.id}
                          onClick={() => void deleteShop(s.id, s.name)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
