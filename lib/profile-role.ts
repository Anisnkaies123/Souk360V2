import { supabase } from '@/lib/supabase';

export type ProfileRole = 'user' | 'owner' | 'admin';

export async function fetchProfileRole(userId: string): Promise<ProfileRole | null> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
      .abortSignal(controller.signal);

    if (error || !data || typeof data.role !== 'string') return null;
    const r = data.role as ProfileRole;
    if (r === 'user' || r === 'owner' || r === 'admin') return r;
    return null;
  } catch (err) {
    console.error('profile role lookup failed', err);
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}
