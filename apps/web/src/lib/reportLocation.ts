/**
 * Parses initial report location from URL search params.
 * Returns { lat, lng } when both valid numbers are present, otherwise null.
 */
export function getInitialLocationFromSearchParams(params: {
  lat?: string | string[];
  lng?: string | string[];
}): { lat: number; lng: number } | null {
  const latStr = Array.isArray(params.lat) ? params.lat[0] : params.lat;
  const lngStr = Array.isArray(params.lng) ? params.lng[0] : params.lng;
  if (latStr == null || lngStr == null) return null;
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
