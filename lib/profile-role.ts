import { supabase } from '@/lib/supabase';

export type ProfileRole = 'user' | 'owner' | 'admin';

export async function fetchProfileRole(userId: string): Promise<ProfileRole | null> {
  const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();

  if (error || !data || typeof data.role !== 'string') return null;
  const r = data.role as ProfileRole;
  if (r === 'user' || r === 'owner' || r === 'admin') return r;
  return null;
}
