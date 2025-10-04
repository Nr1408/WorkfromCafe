import { supabase, getCurrentUser } from '../lib/supabase';
import { emit } from '../lib/events';

// Hybrid: prefer placeId (Google Places), fallback to legacy cafeId during transition.
export async function submitCheckIn({ placeId, cafeId, crowdLevel, wifiSpeed, powerOutlets, noiseLevel }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  if (!placeId && (cafeId == null)) {
    throw new Error('Missing placeId (preferred) or cafeId');
  }

  const payload = {
    user_id: user.id,
    crowd_level: crowdLevel ?? null,
    wifi_speed: wifiSpeed != null ? Number(wifiSpeed) : null,
    power_outlets: powerOutlets ?? null,
    noise_level: noiseLevel ?? null,
  };
  if (placeId) payload.place_id = placeId; else payload.cafe_id = cafeId; // transitional support

  const { data, error } = await supabase
    .from('check_ins')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  // Emit the exact row returned from the database so Community screen has id & timestamps
  emit('check_in:new', data);
  return data;
}

export async function fetchRecentCheckIns({ placeId, cafeId, limit = 50 }) {
  let query = supabase
    .from('check_ins')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (placeId) query = query.eq('place_id', placeId); else if (cafeId) query = query.eq('cafe_id', cafeId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
