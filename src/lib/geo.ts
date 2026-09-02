const EARTH_RADIUS_KM = 6371;

export type Coords = { lat: number; lng: number };

/**
 * Great-circle distance in km. Mirrors the `earth_distance` filter that the
 * provider-feed RLS policy applies server-side, so the client can label a row
 * it already received without a second round trip.
 *
 * Kept free of React Native imports so it stays runnable under plain node
 * (see scripts/checks.ts).
 */
export function distanceKm(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
