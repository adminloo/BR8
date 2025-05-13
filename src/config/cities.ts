export const SUPPORTED_CITIES = {
  SEATTLE: {
    id: 'seattle',
    name: 'Seattle',
    path: 'FinalBathrooms/SeattleFinal/bathrooms',
    bounds: {
      latitude: { min: 47.4, max: 47.8 },
      longitude: { min: -122.5, max: -122.2 }
    },
    center: { latitude: 47.6062, longitude: -122.3321 }
  },
  BOSTON: {
    id: 'boston',
    name: 'Boston',
    path: 'FinalBathrooms/BostonFinal/bathrooms',
    bounds: {
      latitude: { min: 42.2, max: 42.4 },
      longitude: { min: -71.2, max: -70.8 }
    },
    center: { latitude: 42.3601, longitude: -71.0589 }
  },
  CHICAGO: {
    id: 'chicago',
    name: 'Chicago',
    path: 'FinalBathrooms/ChicagoFinal/bathrooms',
    bounds: {
      latitude: { min: 41.7, max: 42.0 },
      longitude: { min: -87.9, max: -87.5 }
    },
    center: { latitude: 41.8781, longitude: -87.6298 }
  },
  NYC: {
    id: 'nyc',
    name: 'New York City',
    path: 'FinalBathrooms/NYCFinal/bathrooms',
    bounds: {
      latitude: { min: 40.4, max: 40.9 },
      longitude: { min: -74.3, max: -73.7 }
    },
    center: { latitude: 40.7128, longitude: -74.0060 }
  }
} as const;

export const CITY_BOUNDS = {
  SEATTLE: {
    ne: { lat: 47.734145, lng: -122.224087 },
    sw: { lat: 47.491912, lng: -122.459696 }
  }
}; 