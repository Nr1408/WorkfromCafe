import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Optional dynamic import for expo-updates – avoids hard failure in Expo Go if module not present
let Updates;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Updates = require('expo-updates');
} catch (_e) {
  // Not installed / not available in this runtime (Expo Go without updates), that's fine.
}

// Attempt to read extra values from multiple possible sources depending on environment:
// - development (Constants.expoConfig.extra)
// - production OTA update (Updates.manifest.extra)
// - new manifest format (manifest2) future-proof
function resolveExtras() {
  const fromConstants = Constants?.expoConfig?.extra;
  if (fromConstants) return fromConstants;
  if (Updates) {
    const manifestExtra = Updates.manifest?.extra || Updates.manifest?.metadata?.extra;
    if (manifestExtra) return manifestExtra;
    if (Updates.manifest2?.extra) return Updates.manifest2.extra;
  }
  return {};
}

const extras = resolveExtras();
const SUPABASE_URL = extras.SUPABASE_URL;
const SUPABASE_ANON_KEY = extras.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing env values. extras keys:', Object.keys(extras));
  throw new Error('Missing Supabase environment values. Ensure expo.extra.* is set and restart with cache clear.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // mobile
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
});

// Helper: get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
