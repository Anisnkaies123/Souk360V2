'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { CATEGORIES } from '@/lib/data';
import { supabase } from '@/lib/supabase';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

type HoursEntry = { open: boolean; from: string; to: string };

type Shop = {
  id: string;
  name: string;
  category: string;
  description: string;
  phone: string;
  whatsapp: string;
  address: string;
  working_hours: Record<string, HoursEntry>;
  owner_id: string;
};

export default function EditShopPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    phone: '',
    whatsapp: '',
    address: '',
    working_hours: {} as Record<string, HoursEntry>,
  });

  useEffect(() => {
    async function loadShop() {
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

      // Fetch shop
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (shopError || !shopData) {
        setError('Commerce introuvable.');
        setLoading(false);
        return;
      }

      // Check ownership
      if (shopData.owner_id !== currentUser.id) {
        router.replace('/dashboard');
        return;
      }

      setShop(shopData as Shop);
      setForm({
        name: shopData.name || '',
        category: shopData.category || '',
        description: shopData.description || '',
        phone: shopData.phone || '',
        whatsapp: shopData.whatsapp || '',
        address: shopData.address || '',
        working_hours: (shopData.working_hours as Record<string, HoursEntry>) || {},
      });
      setLoading(false);
    }

    loadShop();
  }, [router, shopId]);

  function updateField(key: keyof typeof form, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  }

  function updateHours(day: string, field: keyof HoursEntry, value: unknown) {
    setForm((prev) => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: { ...prev.working_hours[day], [field]: value },
      },
    }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !shop) return;

    setSaving(true);
    setError('');

    const { error: updateError } = await supabase
      .from('shops')
      .update({
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || null,
        address: form.address.trim(),
        working_hours: form.working_hours,
      })
      .eq('id', shopId)
      .eq('owner_id', user.id);

    setSaving(false);

    if (updateError) {
      setError('Impossible de sauvegarder. Veuillez réessayer.');
      console.error('Shop update error:', updateError);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  }

  if (!authChecked || loading) {
    return (
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: '#94b4d4' }}>
        Chargement…
      </main>
    );
  }

  if (error && !shop) {
    return (
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#f87171', fontSize: '1.125rem', marginBottom: '1.5rem' }}>{error}</p>
        <Link href="/dashboard" className="btn-primary">
          Retour au dashboard
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px 64px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
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
          Modifier ma boutique
        </h1>
        <p style={{ color: '#94b4d4', margin: 0 }}>{shop?.name}</p>
      </div>

      {/* Success Message */}
      {success && (
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
          Vos modifications ont été enregistrées ✓
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
        {/* Name */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="label" htmlFor="name">
            Nom du commerce *
          </label>
          <input
            id="name"
            className="input"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="label">Catégorie *</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => updateField('category', cat.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '100px',
                  border: '1.5px solid',
                  borderColor: form.category === cat.value ? '#378ADD' : '#1e4a7a',
                  background: form.category === cat.value ? 'rgba(55,138,221,0.12)' : '#163660',
                  color: form.category === cat.value ? '#378ADD' : '#94b4d4',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="label" htmlFor="description">
            Description *
          </label>
          <textarea
            id="description"
            className="input"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
            style={{ resize: 'vertical' }}
            required
          />
        </div>

        {/* Phone & WhatsApp */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label className="label" htmlFor="phone">
              Téléphone *
            </label>
            <input
              id="phone"
              className="input"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="whatsapp">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              className="input"
              value={form.whatsapp}
              onChange={(e) => updateField('whatsapp', e.target.value)}
            />
          </div>
        </div>

        {/* Address */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="label" htmlFor="address">
            Adresse *
          </label>
          <input
            id="address"
            className="input"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            required
          />
        </div>

        {/* Working Hours */}
        <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#f0f4f8', margin: '0 0 1rem' }}>
          🕐 Horaires d'ouverture
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
          {DAYS.map((day) => {
            const hours = form.working_hours[day] || { open: day !== 'Dimanche', from: '09:00', to: '18:00' };
            return (
              <div
                key={day}
                style={{
                  background: '#163660',
                  border: '1px solid #1e4a7a',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '110px' }}>
                  <input
                    type="checkbox"
                    checked={hours.open}
                    onChange={(e) => updateHours(day, 'open', e.target.checked)}
                    style={{ accentColor: '#378ADD', width: '16px', height: '16px' }}
                  />
                  <span style={{ color: '#f0f4f8', fontWeight: 600, fontSize: '0.875rem' }}>{day}</span>
                </label>
                {hours.open ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <input
                      type="time"
                      value={hours.from}
                      onChange={(e) => updateHours(day, 'from', e.target.value)}
                      style={{
                        background: '#0f2d56',
                        border: '1px solid #1e4a7a',
                        borderRadius: '6px',
                        color: '#f0f4f8',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                      }}
                    />
                    <span style={{ color: '#5a7fa8' }}>–</span>
                    <input
                      type="time"
                      value={hours.to}
                      onChange={(e) => updateHours(day, 'to', e.target.value)}
                      style={{
                        background: '#0f2d56',
                        border: '1px solid #1e4a7a',
                        borderRadius: '6px',
                        color: '#f0f4f8',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                ) : (
                  <span style={{ color: '#f87171', fontSize: '0.875rem', fontWeight: 600 }}>Fermé</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/dashboard" className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
            Annuler
          </Link>
          <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </main>
  );
}
