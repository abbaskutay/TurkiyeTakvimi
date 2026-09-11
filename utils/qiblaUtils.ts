export interface QiblaCalculationResult {
  bearing: number;
  distance: number;
}

/**
 * Calculates direct bearing (in degrees, 0-360) and orthodromic distance (in km)
 * from a given latitude & longitude to the Kaaba in Mecca (21.4225° N, 39.8262° E).
 */
export function calculateDirectQibla(lat1: number, lon1: number): QiblaCalculationResult {
  const lat2 = 21.4225; // Kaaba latitude
  const lon2 = 39.8262; // Kaaba longitude

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  let bearing = toDeg(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;

  const R = 6371; // Earth's radius in km
  const dLat = phi2 - phi1;
  const dLon = deltaLambda;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = Math.round(R * c);

  return { bearing, distance };
}
