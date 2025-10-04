import Constants from "expo-constants";

const API_KEY =
  Constants.expoConfig?.extra?.googlePlacesApiKey ||
  Constants.manifest?.extra?.googlePlacesApiKey;
const PROXY =
  Constants.expoConfig?.extra?.placesProxyUrl ||
  Constants.manifest?.extra?.placesProxyUrl;

const BASE = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const AUTOCOMPLETE_BASE =
  "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const DETAILS_BASE = "https://maps.googleapis.com/maps/api/place/details/json";

export async function fetchNearbyCafes({
  latitude,
  longitude,
  radius = 5000,
  keyword,
}) {
  if (!API_KEY && !PROXY)
    throw new Error("Missing Places API key or proxy URL");
  const params =
    `location=${latitude},${longitude}&radius=${radius}&type=cafe` +
    (keyword ? `&keyword=${encodeURIComponent(keyword)}` : "");
  const url = PROXY
    ? `${PROXY.replace(/\/$/, "")}/places/nearby?${params}`
    : `${BASE}?${params}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Places API error: ${res.status}`);
  const data = await res.json();
  if (PROXY) {
    // Expect proxy to wrap Google response or return normalized list
    if (Array.isArray(data)) {
      return data;
    }
  }
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(
      `Places API returned ${data.status}: ${data.error_message || ""}`
    );
  }
  const results = (data.results || [])
    .map((r, idx) => ({
      id: r.place_id || String(idx),
      name: r.name,
      latitude: r.geometry?.location?.lat,
      longitude: r.geometry?.location?.lng,
      address: r.vicinity || r.formatted_address || "Address unavailable",
      current_crowd_level: "Unknown",
      current_wifi_speed_mbps: null,
      last_live_update_at: "Live",
      cover_image_url: r.photos?.[0]
        ? PROXY
          ? `${PROXY.replace(/\/$/, "")}/places/photo?maxwidth=800&ref=${
              r.photos[0].photo_reference
            }`
          : `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${r.photos[0].photo_reference}&key=${API_KEY}`
        : undefined,
    }))
    .filter((x) => x.latitude && x.longitude);
  return results;
}

export async function fetchPlaceSuggestions({
  input,
  latitude,
  longitude,
  radius = 3000,
}) {
  try {
    if (!input || input.trim().length < 2) return [];
    if (!API_KEY && !PROXY) return [];
    const params =
      `input=${encodeURIComponent(input)}` +
      (latitude && longitude
        ? `&location=${latitude},${longitude}&radius=${radius}`
        : "") +
      `&types=establishment&strictbounds=false`;
    const url = `${AUTOCOMPLETE_BASE}?${params}&key=${API_KEY}`; // Prefer direct; proxy endpoint may not exist
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return [];
    return (data.predictions || []).map((p) => ({
      id: p.place_id,
      placeId: p.place_id,
      description: p.description,
      primary: p.structured_formatting?.main_text || p.description,
      secondary: p.structured_formatting?.secondary_text || "",
    }));
  } catch (e) {
    return [];
  }
}

export async function fetchPlaceDetails(placeId) {
  try {
    if (!placeId || (!API_KEY && !PROXY)) return null;
    const fields = "geometry,name,formatted_address";
    const url = `${DETAILS_BASE}?place_id=${encodeURIComponent(
      placeId
    )}&fields=${fields}&key=${API_KEY}`; // Prefer direct; proxy endpoint may not exist
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK") return null;
    const r = data.result;
    return {
      name: r.name,
      address: r.formatted_address,
      latitude: r.geometry?.location?.lat,
      longitude: r.geometry?.location?.lng,
    };
  } catch (e) {
    return null;
  }
}
