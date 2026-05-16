import { supabase } from '@/lib/supabase';

export type ProfileRole = 'user' | 'owner' | 'admin';

export async function fetchProfileRole(userId: string): Promise<ProfileRole | null> {
  let timeout: ReturnType<typeof window.setTimeout> | undefined;
  const timedOut = new Promise<null>((resolve) => {
    timeout = window.setTimeout(() => {
      console.error('profile role lookup timed out');
      resolve(null);
    }, 8000);
  });

  try {
    const result = await Promise.race([
      supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
      timedOut,
    ]);

    if (!result) return null;

    const { data, error } = result;
    if (error || !data || typeof data.role !== 'string') return null;
    const r = data.role as ProfileRole;
    if (r === 'user' || r === 'owner' || r === 'admin') return r;
    return null;
  } catch (err) {
    console.error('profile role lookup failed', err);
    return null;
  } finally {
    if (timeout) window.clearTimeout(timeout);
  }
}
