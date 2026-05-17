'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { formatPostDate, POST_TYPE_META, POST_TYPES, type PostRow, type PostType } from '@/lib/posts';
import { supabase } from '@/lib/supabase';

type Shop = {
  id: string;
  name: string;
  owner_id: string;
};

export default function ShopPostsPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ type: 'annonce' as PostType, title: '', content: '' });

  async function loadPosts() {
    if (!shopId) return;

    const { data, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (postsError) {
      setError('Impossible de charger les publications. Veuillez réessayer.');
      console.error('Posts fetch error:', postsError);
      return;
    }

    setPosts((data as PostRow[]) ?? []);
  }

  useEffect(() => {
    async function loadPage() {
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

      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, name, owner_id')
        .eq('id', shopId)
        .single();

      if (shopError || !shopData) {
        setError('Commerce introuvable.');
        setLoading(false);
        return;
      }

      if (shopData.owner_id !== currentUser.id) {
        router.replace('/dashboard');
        return;
      }

      setShop(shopData as Shop);
      await loadPosts();
      setLoading(false);
    }

    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, shopId]);

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !shop) return;

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      setError('Veuillez renseigner un titre et un contenu.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const { error: insertError } = await supabase.from('posts').insert({
      shop_id: shop.id,
      owner_id: user.id,
      title,
      content,
      type: form.type,
    });

    setSaving(false);

    if (insertError) {
      setError("Impossible de publier pour le moment. Veuillez réessayer.");
      console.error('Post insert error:', insertError);
      return;
    }

    setForm({ type: 'annonce', title: '', content: '' });
    setShowForm(false);
    setSuccess('Publication ajoutée ✓');
    await loadPosts();
  }

  async function deletePost(postId: string) {
    if (!user || !window.confirm('Supprimer cette publication ?')) return;

    setError('');
    setSuccess('');

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('owner_id', user.id);

    if (deleteError) {
      setError('Impossible de supprimer cette publication. Veuillez réessayer.');
      console.error('Post delete error:', deleteError);
      return;
    }

    setPosts((prev) => prev.filter((post) => post.id !== postId));
  }

  if (!authChecked || loading) {
    return (
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: '#94b4d4' }}>
        Chargement des publications…
      </main>
    );
  }

  if (error && !shop) {
    return (
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#f87171', fontSize: '1.125rem', marginBottom: '1.5rem' }}>{error}</p>
        <Link href="/dashboard" className="btn-primary">
          Retour au dashboard
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#94b4d4',
              fontSize: '0.875rem',
              textDecoration: 'none',
              marginBottom: '1rem',
            }}
          >
            ← Retour au dashboard
          </Link>
          <h1 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#f0f4f8', margin: '0 0 0.35rem' }}>
            Annonces & Publications
          </h1>
          <p style={{ color: '#94b4d4', margin: 0 }}>{shop?.name}</p>
        </div>
        <button type="button" onClick={() => setShowForm((prev) => !prev)} className="btn-primary">
          + Nouvelle publication
        </button>
      </div>

      {success ? (
        <div
          style={{
            background: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid rgba(74, 222, 128, 0.35)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#4ade80',
            fontWeight: 600,
          }}
        >
          {success}
        </div>
      ) : null}

      {error ? <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p> : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Type</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {POST_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateField('type', type.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '999px',
                    border: '1.5px solid',
                    borderColor: form.type === type.value ? POST_TYPE_META[type.value].color : '#1e4a7a',
                    background: form.type === type.value ? `${POST_TYPE_META[type.value].color}24` : '#163660',
                    color: form.type === type.value ? '#f0f4f8' : '#94b4d4',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label" htmlFor="title">
              Titre *
            </label>
            <input
              id="title"
              className="input"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <label className="label" htmlFor="content">
                Contenu *
              </label>
              <span style={{ color: form.content.length >= 450 ? '#f4a61d' : '#5a7fa8', fontSize: '0.8125rem' }}>
                {form.content.length}/500
              </span>
            </div>
            <textarea
              id="content"
              className="input"
              value={form.content}
              onChange={(e) => updateField('content', e.target.value)}
              rows={5}
              maxLength={500}
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Publication…' : 'Publier'}
          </button>
        </form>
      ) : null}

      {posts.length === 0 ? (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#f0f4f8', margin: '0 0 0.5rem' }}>
            Aucune publication pour le moment.
          </h2>
          <p style={{ color: '#94b4d4', margin: 0 }}>Créez votre première annonce !</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {posts.map((post) => {
            const meta = POST_TYPE_META[post.type] ?? POST_TYPE_META.annonce;
            return (
              <article key={post.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '999px',
                        padding: '0.25rem 0.7rem',
                        background: meta.color,
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        marginBottom: '0.75rem',
                      }}
                    >
                      {meta.label}
                    </span>
                    <h2 style={{ color: '#f0f4f8', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 0.45rem' }}>
                      {post.title}
                    </h2>
                    <p
                      style={{
                        color: '#94b4d4',
                        lineHeight: 1.6,
                        margin: '0 0 0.75rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {post.content}
                    </p>
                    <span style={{ color: '#5a7fa8', fontSize: '0.8125rem' }}>{formatPostDate(post.created_at)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deletePost(post.id)}
                    className="btn-outline"
                    aria-label="Supprimer la publication"
                    title="Supprimer"
                    style={{ padding: '0.45rem 0.7rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.35)' }}
                  >
                    🗑️
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
