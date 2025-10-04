import { supabase, getCurrentUser } from '../lib/supabase';

export async function submitCheckIn({ cafeId, crowdLevel, wifiSpeed, powerOutlets, noiseLevel }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('check_ins').insert({
    cafe_id: cafeId,
    user_id: user.id,
    crowd_level: crowdLevel ?? null,
    wifi_speed: wifiSpeed != null ? Number(wifiSpeed) : null,
    power_outlets: powerOutlets ?? null,
    noise_level: noiseLevel ?? null,
  });
  if (error) throw error;
  return true;
}

export async function fetchRecentCheckIns(cafeId, limit = 50) {
  let query = supabase
    .from('check_ins')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (cafeId) query = query.eq('cafe_id', cafeId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
