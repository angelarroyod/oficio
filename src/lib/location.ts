import * as Location from 'expo-location';

export type Coords = { lat: number; lng: number };

export type ResolvedPlace = Coords & { addressText: string | null };

/**
 * One-shot foreground fix plus a reverse-geocoded street line. Balanced
 * accuracy (~100 m) is deliberate: the request only needs to land in the right
 * colonia for the radius filter, and Highest costs seconds of GPS warm-up on
 * the cheap Android phones this app is aimed at.
 */
export async function resolveCurrentPlace(): Promise<ResolvedPlace | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const coords: Coords = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };

  try {
    const [place] = await Location.reverseGeocodeAsync({
      latitude: coords.lat,
      longitude: coords.lng,
    });
    if (!place) return { ...coords, addressText: null };

    const line = [
      [place.street, place.streetNumber].filter(Boolean).join(' '),
      place.district,
      place.city,
    ]
      .filter((part) => Boolean(part && part.trim()))
      .join(', ');

    return { ...coords, addressText: line || null };
  } catch {
    // A fix without a street name is still a usable fix.
    return { ...coords, addressText: null };
  }
}
