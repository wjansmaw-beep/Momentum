export const MAX_RADIUS_METERS = 4500;
export const MAX_RESULTS = 20;
export const MAX_DAILY_ATTEMPTS = 30;

/** Boundary only; no network, persistence, credentials or inferred consent. */
export function parseRegionRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid-request');
  const keys = Object.keys(value).sort();
  if (keys.length !== 2 || keys[0] !== 'latitude' || keys[1] !== 'longitude') throw new Error('unexpected-fields');
  for (const [key, limit] of [['latitude', 90], ['longitude', 180]]) {
    const number = value[key];
    if (typeof number !== 'number' || !Number.isFinite(number) || Math.abs(number) > limit) throw new Error('invalid-region');
    // Reject precise input rather than silently forwarding or storing it.
    if (Math.abs(number * 100 - Math.round(number * 100)) > 1e-9) throw new Error('region-too-precise');
  }
  return { latitude: value.latitude, longitude: value.longitude };
}

export function buildPlacesRequest(region, apiKey) {
  const { latitude, longitude } = parseRegionRequest(region);
  if (typeof apiKey !== 'string' || !apiKey.trim() || /[\r\n]/.test(apiKey)) throw new Error('source-not-configured');
  // Search categories are NOT an eligibility/access guarantee. Qualification
  // must inspect subtypes (including reserves) and source evidence afterwards.
  return {
    url: 'https://api.geoapify.com/v2/places',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      redirect: 'error',
      body: JSON.stringify({ categories: ['leisure.park', 'tourism.attraction.viewpoint'], filter: { type: 'circle', lon: longitude, lat: latitude, radius: MAX_RADIUS_METERS }, limit: MAX_RESULTS, lang: 'nl' }),
    },
  };
}
