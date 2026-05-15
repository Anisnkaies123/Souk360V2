'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { CATEGORIES } from '@/lib/data';
import {
  MAX_SHOP_PHOTOS,
  type ShopPhotoUpload,
  deleteShopPhoto,
  uploadShopPhoto,
  validateShopPhotoFile,
} from '@/lib/shop-photos';
import { supabase } from '@/lib/supabase';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

type HoursEntry = { open: boolean; from: string; to: string };

type FormData = {
  name: string;
  category: string;
  description: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: Record<string, HoursEntry>;
  photos: string[];
};

const defaultHours: Record<string, HoursEntry> = DAYS.reduce((acc, day) => {
  acc[day] = { open: day !== 'Dimanche', from: '09:00', to: '18:00' };
  return acc;
}, {} as Record<string, HoursEntry>);

export default function AddShopPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: '',
    category: '',
    description: '',
    phone: '',
    whatsapp: '',
    address: '',
    hours: defaultHours,
    photos: [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [photoItems, setPhotoItems] = useState<ShopPhotoUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
      if (!session?.user) {
        router.replace(`/login?next=${encodeURIComponent('/add-shop')}`);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.replace(`/login?next=${encodeURIComponent('/add-shop')}`);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  function updateField(key: keyof FormData, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Le nom est requis.';
    if (!form.category) e.category = 'Veuillez choisir une catégorie.';
    if (!form.description.trim()) e.description = 'La description est requise.';
    if (!form.phone.trim()) e.phone = 'Le téléphone est requis.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!form.address.trim()) e.address = "L'adresse est requise.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  const uploadedPhotoUrls = photoItems
    .filter((p) => p.publicUrl && !p.error)
    .map((p) => p.publicUrl as string);

  const photosUploading = photoItems.some((p) => p.uploading);

  const photoItemsRef = useRef(photoItems);
  photoItemsRef.current = photoItems;
  useEffect(() => {
    return () => {
      photoItemsRef.current.forEach((p) => {
        if (p.previewUrl.startsWith('blob:')) URL.revokeObjectURL(p.previewUrl);
      });
    };
  }, []);

  const addPhotoFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!user) return;
      setPhotoError('');
      const list = Array.from(files);
      const remaining = MAX_SHOP_PHOTOS - photoItems.length;
      if (remaining <= 0) {
        setPhotoError(`Maximum ${MAX_SHOP_PHOTOS} photos.`);
        return;
      }
      const toAdd = list.slice(0, remaining);
      if (list.length > remaining) {
        setPhotoError(`Seules ${remaining} photo(s) supplémentaire(s) ont été ajoutées (max ${MAX_SHOP_PHOTOS}).`);
      }

      for (const file of toAdd) {
        const validationError = validateShopPhotoFile(file);
        const id = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);

        if (validationError) {
          setPhotoItems((prev) => [
            ...prev,
            { id, previewUrl, uploading: false, error: validationError },
          ]);
          continue;
        }

        setPhotoItems((prev) => [...prev, { id, previewUrl, uploading: true }]);

        try {
          const { publicUrl, storagePath } = await uploadShopPhoto(file, user.id);
          setPhotoItems((prev) =>
            prev.map((p) =>
              p.id === id ? { ...p, publicUrl, storagePath, uploading: false, error: undefined } : p,
            ),
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Échec du téléversement. Vérifiez le bucket Supabase.';
          setPhotoItems((prev) =>
            prev.map((p) => (p.id === id ? { ...p, uploading: false, error: message } : p)),
          );
        }
      }
    },
    [user, photoItems.length],
  );

  async function removePhoto(item: ShopPhotoUpload) {
    if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
    if (item.storagePath) {
      try {
        await deleteShopPhoto(item.storagePath);
      } catch {
        /* keep UI in sync even if storage delete fails */
      }
    }
    setPhotoItems((prev) => prev.filter((p) => p.id !== item.id));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      void addPhotoFiles(e.dataTransfer.files);
    }
  }

  async function handleSubmit() {
    if (!user) return;
    if (photosUploading) {
      setSubmitError('Veuillez attendre la fin du téléversement des photos.');
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    const { error } = await supabase.from('shops').insert({
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      whatsapp: form.whatsapp.trim() || null,
      hours: form.hours,
      photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : [],
      owner_id: user.id,
      is_approved: false,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message || 'Impossible d’enregistrer le commerce.');
      return;
    }
    setSubmitted(true);
  }

  const STEPS = [
    { n: 1, label: 'Infos de base' },
    { n: 2, label: 'Localisation & Horaires' },
    { n: 3, label: 'Photos' },
  ];

  if (!authChecked || !user) {
    return (
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 16px', textAlign: 'center', color: '#94b4d4' }}>
        Vérification de la session…
      </main>
    );
  }

  if (submitted) {
    return (
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#f0f4f8', margin: '0 0 0.75rem' }}>
          Commerce soumis !
        </h1>
        <p style={{ color: '#94b4d4', lineHeight: 1.7, marginBottom: '2rem' }}>
          Votre commerce <strong style={{ color: '#f0f4f8' }}>{form.name}</strong> a été enregistré et sera visible après
          validation par l&apos;équipe Souk360.
        </p>
        <button onClick={() => router.push('/')} className="btn-primary" style={{ fontSize: '1rem' }}>
          Retour à l&apos;accueil
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px 64px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#f0f4f8', margin: '0 0 0.5rem' }}>
          Ajouter mon commerce
        </h1>
        <p style={{ color: '#94b4d4', margin: 0 }}>Rejoignez l&apos;annuaire Souk360 gratuitement.</p>
      </div>

      <div style={{ display: 'flex', gap: '0', marginBottom: '2.5rem', position: 'relative' }}>
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {i < STEPS.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: '50%',
                  width: '100%',
                  height: '2px',
                  background: step > s.n ? '#378ADD' : '#1e4a7a',
                  zIndex: 0,
                }}
              />
            )}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: step >= s.n ? '#378ADD' : '#0f2d56',
                border: `2px solid ${step >= s.n ? '#378ADD' : '#1e4a7a'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: step >= s.n ? 'white' : '#5a7fa8',
                fontSize: '0.875rem',
                zIndex: 1,
                position: 'relative',
              }}
            >
              {step > s.n ? '✓' : s.n}
            </div>
            <span
              style={{
                marginTop: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: step >= s.n ? '#378ADD' : '#5a7fa8',
                textAlign: 'center',
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{ background: '#0f2d56', border: '1px solid #1e4a7a', borderRadius: '16px', padding: '2rem' }}>
        {submitError && (
          <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>{submitError}</p>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#f0f4f8', margin: '0 0 1.5rem' }}>
              Informations de base
            </h2>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label" htmlFor="name">
                Nom du commerce *
              </label>
              <input
                id="name"
                className="input"
                placeholder="Ex : Atelier Ben Salem"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
              {errors.name && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '4px' }}>{errors.name}</p>}
            </div>

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
              {errors.category && (
                <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '6px' }}>{errors.category}</p>
              )}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label" htmlFor="description">
                Description *
              </label>
              <textarea
                id="description"
                className="input"
                placeholder="Décrivez votre commerce, vos produits ou services…"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                style={{ resize: 'vertical' }}
              />
              {errors.description && (
                <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '4px' }}>{errors.description}</p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label" htmlFor="phone">
                  Téléphone *
                </label>
                <input
                  id="phone"
                  className="input"
                  placeholder="+216 XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
                {errors.phone && (
                  <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '4px' }}>{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="whatsapp">
                  WhatsApp
                </label>
                <input
                  id="whatsapp"
                  className="input"
                  placeholder="+216 XX XXX XXX"
                  value={form.whatsapp}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#f0f4f8', margin: '0 0 1.5rem' }}>
              Localisation et horaires
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label" htmlFor="address">
                Adresse *
              </label>
              <input
                id="address"
                className="input"
                placeholder="Ex : 12 Rue de la République, Bizerte"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
              {errors.address && (
                <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '4px' }}>{errors.address}</p>
              )}
            </div>

            <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#f0f4f8', margin: '0 0 1rem' }}>
              🕐 Horaires d&apos;ouverture
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DAYS.map((day) => {
                const h = form.hours[day];
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
                        checked={h.open}
                        onChange={(e) => {
                          updateField('hours', { ...form.hours, [day]: { ...h, open: e.target.checked } });
                        }}
                        style={{ accentColor: '#378ADD', width: '16px', height: '16px' }}
                      />
                      <span style={{ color: '#f0f4f8', fontWeight: 600, fontSize: '0.875rem' }}>{day}</span>
                    </label>
                    {h.open ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <input
                          type="time"
                          value={h.from}
                          onChange={(e) =>
                            updateField('hours', { ...form.hours, [day]: { ...h, from: e.target.value } })
                          }
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
                          value={h.to}
                          onChange={(e) =>
                            updateField('hours', { ...form.hours, [day]: { ...h, to: e.target.value } })
                          }
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
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#f0f4f8', margin: '0 0 0.5rem' }}>
              Photos de votre commerce
            </h2>
            <p style={{ color: '#94b4d4', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Ajoutez des photos pour attirer plus de clients. (facultatif)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.length) void addPhotoFiles(e.target.files);
                e.target.value = '';
              }}
            />

            <div
              style={{
                border: `2px dashed ${isDragging ? '#378ADD' : '#1e4a7a'}`,
                borderRadius: '12px',
                padding: '3rem 1rem',
                textAlign: 'center',
                cursor: photoItems.length >= MAX_SHOP_PHOTOS ? 'not-allowed' : 'pointer',
                background: isDragging ? 'rgba(55,138,221,0.08)' : '#163660',
                marginBottom: '1rem',
                transition: 'border-color 0.2s, background 0.2s',
                opacity: photoItems.length >= MAX_SHOP_PHOTOS ? 0.6 : 1,
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              onClick={() => {
                if (photoItems.length < MAX_SHOP_PHOTOS) fileInputRef.current?.click();
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDrop={handleDrop}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📸</div>
              <p style={{ color: '#94b4d4', fontWeight: 600, margin: '0 0 0.25rem' }}>
                {isDragging ? 'Déposez vos photos ici' : 'Glissez vos photos ici ou cliquez'}
              </p>
              <p style={{ color: '#5a7fa8', fontSize: '0.875rem', margin: 0 }}>
                JPG, PNG – max 5 Mo chacune ({photoItems.length}/{MAX_SHOP_PHOTOS})
              </p>
            </div>

            {photoError && (
              <p style={{ color: '#fbbf24', fontSize: '0.85rem', margin: '0 0 1rem' }}>{photoError}</p>
            )}

            {photoItems.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '10px',
                  marginBottom: '1.5rem',
                }}
              >
                {photoItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: item.error ? '2px solid #f87171' : '1px solid #1e4a7a',
                      background: '#0f2d56',
                    }}
                  >
                    <img
                      src={item.previewUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: item.uploading ? 0.5 : 1 }}
                    />
                    {item.uploading && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(10,31,60,0.6)',
                          color: '#94b4d4',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        Envoi…
                      </div>
                    )}
                    {item.error && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                          background: 'rgba(127,29,29,0.75)',
                          color: '#fecaca',
                          fontSize: '0.65rem',
                          textAlign: 'center',
                        }}
                      >
                        {item.error}
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label="Supprimer la photo"
                      onClick={(e) => {
                        e.stopPropagation();
                        void removePhoto(item);
                      }}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(10,31,60,0.9)',
                        color: '#f0f4f8',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#163660', border: '1px solid #1e4a7a', borderRadius: '10px', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, color: '#f0f4f8', margin: '0 0 1rem', fontSize: '0.9375rem' }}>Récapitulatif</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Nom', value: form.name },
                  {
                    label: 'Catégorie',
                    value: CATEGORIES.find((c) => c.value === form.category)?.label || '—',
                  },
                  { label: 'Téléphone', value: form.phone || '—' },
                  { label: 'Adresse', value: form.address || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ color: '#5a7fa8', fontSize: '0.875rem', minWidth: '80px' }}>{label}</span>
                    <span style={{ color: '#f0f4f8', fontSize: '0.875rem', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '12px' }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="btn-outline" style={{ fontSize: '0.9375rem' }}>
              ← Précédent
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button onClick={handleNext} className="btn-primary" style={{ fontSize: '0.9375rem' }}>
              Suivant →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="btn-primary"
              style={{ fontSize: '0.9375rem' }}
              disabled={submitting || photosUploading}
            >
              {submitting ? '…' : photosUploading ? 'Envoi des photos…' : '✓ Soumettre mon commerce'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
