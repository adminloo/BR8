import * as Location from 'expo-location';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global';
import { updateBathroomCache } from './src/hooks/useBathrooms';
import { getBathroomsInRadius } from './src/services/firebase';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Preload data and initialize app
  useEffect(() => {
    console.log('=== APP: Starting initialization ===');
    async function prepare() {
      try {
        console.log('=== APP: Requesting location permissions ===');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('=== APP: Location permission status:', status);
        
        if (status === 'granted') {
          console.log('=== APP: Getting current location ===');
          const location = await Location.getCurrentPositionAsync({});
          console.log('=== APP: Location obtained:', location.coords);
          
          console.log('=== APP: Preloading bathrooms ===');
          const bathrooms = await getBathroomsInRadius({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          console.log('=== APP: Bathrooms preloaded successfully ===');
          updateBathroomCache(bathrooms);
          setDataLoaded(true);
        } else {
          // Even if location permission is denied, we should still proceed
          // The app will just start without preloaded bathrooms
          setDataLoaded(true);
        }
      } catch (e) {
        console.error('=== APP ERROR: During initialization ===', e);
        // Even if there's an error, we should still proceed
        setDataLoaded(true);
      } finally {
        console.log('=== APP: Setting app as ready ===');
        setIsLoading(false);
      }
    }

    prepare();
  }, []);

  if (isLoading || !dataLoaded) {
    console.log('=== APP: Loading... ===');
    return null;
  }

  console.log('=== APP: Rendering main content ===');
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Slot />
    </SafeAreaProvider>
  );
} 