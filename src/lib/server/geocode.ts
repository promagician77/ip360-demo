/**
 * Offline city geocoder for the prototype. Production would call a geocoding
 * provider (Mapbox, Google) and cache results; the interface stays the same.
 */
const CITY_TABLE: Record<string, { lat: number; lng: number }> = {
  austin: { lat: 30.2672, lng: -97.7431 },
  "round rock": { lat: 30.5083, lng: -97.6789 },
  "san antonio": { lat: 29.4241, lng: -98.4936 },
  houston: { lat: 29.7604, lng: -95.3698 },
  dallas: { lat: 32.7767, lng: -96.797 },
  "fort worth": { lat: 32.7555, lng: -97.3308 },
  "new york": { lat: 40.7128, lng: -74.006 },
  brooklyn: { lat: 40.6782, lng: -73.9442 },
  "los angeles": { lat: 34.0522, lng: -118.2437 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  seattle: { lat: 47.6062, lng: -122.3321 },
  portland: { lat: 45.5152, lng: -122.6784 },
  denver: { lat: 39.7392, lng: -104.9903 },
  miami: { lat: 25.7617, lng: -80.1918 },
  atlanta: { lat: 33.749, lng: -84.388 },
  boston: { lat: 42.3601, lng: -71.0589 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
  "san diego": { lat: 32.7157, lng: -117.1611 },
  phoenix: { lat: 33.4484, lng: -112.074 },
  nashville: { lat: 36.1627, lng: -86.7816 },
  london: { lat: 51.5074, lng: -0.1278 },
  manchester: { lat: 53.4808, lng: -2.2426 },
  toronto: { lat: 43.6532, lng: -79.3832 },
  vancouver: { lat: 49.2827, lng: -123.1207 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  melbourne: { lat: -37.8136, lng: 144.9631 },
  berlin: { lat: 52.52, lng: 13.405 },
  paris: { lat: 48.8566, lng: 2.3522 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  lisbon: { lat: 38.7223, lng: -9.1393 },
  "são paulo": { lat: -23.5505, lng: -46.6333 },
  "sao paulo": { lat: -23.5505, lng: -46.6333 },
  dublin: { lat: 53.3498, lng: -6.2603 },
  amsterdam: { lat: 52.3676, lng: 4.9041 },
};

export const KNOWN_CITIES = Object.keys(CITY_TABLE).map((c) => c.replace(/\b\w/g, (m) => m.toUpperCase()));

/** Resolves "Austin, TX" → coordinates. Unknown cities fall back to Austin with `resolved: false`. */
export function geocodeCity(city: string): { lat: number; lng: number; resolved: boolean } {
  const key = city.toLowerCase().split(",")[0].trim();
  const hit = CITY_TABLE[key];
  if (hit) return { ...hit, resolved: true };
  return { ...CITY_TABLE.austin, resolved: false };
}
