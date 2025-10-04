import { supabase } from '../lib/supabase';

export async function fetchProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function updateProfile(userId, fields) {
  if (!userId) throw new Error('No user id');
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...fields });
  if (error) throw error;
  return data;
}
