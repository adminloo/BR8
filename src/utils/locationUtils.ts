export function isLocationWithinCityBounds(
  location: { latitude: number; longitude: number },
  bounds: { latitude: { min: number; max: number }, longitude: { min: number; max: number } }
) {
  return (
    location.latitude >= bounds.latitude.min &&
    location.latitude <= bounds.latitude.max &&
    location.longitude >= bounds.longitude.min &&
    location.longitude <= bounds.longitude.max
  );
}

export function getNearestCities(
  location: { latitude: number; longitude: number },
  limit: number = 3
) {
  return Object.values(SUPPORTED_CITIES)
    .map(city => ({
      ...city,
      distance: calculateDistance(
        location.latitude,
        location.longitude,
        city.center.latitude,
        city.center.longitude
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
} 