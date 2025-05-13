import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useBathrooms } from '../hooks/useBathrooms';
import { SUPPORTED_CITIES } from '../config/cities';

const MapScreen = () => {
  const [region, setRegion] = useState({
    latitude: 47.6062,  // Seattle
    longitude: -122.3321,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const bounds = {
    ne: {
      lat: region.latitude + region.latitudeDelta/2,
      lng: region.longitude + region.longitudeDelta/2,
    },
    sw: {
      lat: region.latitude - region.latitudeDelta/2,
      lng: region.longitude - region.longitudeDelta/2,
    }
  };

  useEffect(() => {
    console.log('Region changed:', region);
    console.log('Calculated bounds:', bounds);
  }, [region]);

  const { bathrooms, isLoading } = useBathrooms({
    location: {
      latitude: region.latitude,
      longitude: region.longitude
    }
  });

  useEffect(() => {
    console.log('Current location:', {
      latitude: region.latitude,
      longitude: region.longitude
    });
    console.log('Current bathrooms:', bathrooms.length);
  }, [region, bathrooms]);

  // ... rest of your map component

  return (
    <View>
      {/* Your map component */}
    </View>
  );
};

export default MapScreen; 