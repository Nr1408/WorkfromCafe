import { fetchCafes } from './cafes';
import { supabase } from '../lib/supabase';

function timeAgoString(iso) {
  if (!iso) return 'Never';
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

async function fetchLatestCheckInForCafe(cafeId) {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('cafe_id', cafeId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data && data.length ? data[0] : null;
}

function shapeCafe(cafeRow, latestCheckIn) {
  const lc = latestCheckIn;
  return {
    id: String(cafeRow.id),
    name: cafeRow.name,
    latitude: cafeRow.latitude,
    longitude: cafeRow.longitude,
    current_crowd_level: lc?.crowd_level || 'Unknown',
    current_wifi_speed_mbps: lc?.wifi_speed != null ? Number(lc.wifi_speed) : 0,
    current_power_outlets_rating: lc?.power_outlets || 'Unknown',
    current_noise_level_rating: lc?.noise_level || 'Unknown',
    last_live_update_at: lc ? timeAgoString(lc.created_at) : 'Never',
    cover_image_url: 'https://placehold.co/600x400?text=Cafe',
    address: cafeRow.address || 'Address unavailable',
    hours_of_operation: 'Hours not set',
    community_tips: 'No community tips yet.',
  };
}

export async function fetchCompositeCafes() {
  const cafes = await fetchCafes();
  const latestList = await Promise.all(
    cafes.map(c => fetchLatestCheckInForCafe(c.id).catch(() => null))
  );
  return cafes.map((c, i) => shapeCafe(c, latestList[i]));
}
