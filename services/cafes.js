import { supabase } from '../lib/supabase';

export async function fetchCafes() {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}
