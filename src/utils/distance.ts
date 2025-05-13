export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Returns distance in kilometers
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function findNearbyBathrooms(
  latitude: number,
  longitude: number,
  bathrooms: Array<{ latitude: number; longitude: number; id: string }>,
  thresholdKm: number = 0.05 // Default 50 meters (0.05 km)
) {
  return bathrooms.filter((bathroom) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      bathroom.latitude,
      bathroom.longitude
    );
    return distance <= thresholdKm;
  });
} 