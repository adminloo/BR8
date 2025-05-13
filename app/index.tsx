import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { BathroomMarker } from '../src/components/BathroomMarker';
import { FilterSheet } from '../src/components/FilterSheet';
import { useBathrooms } from '../src/hooks/useBathrooms';
import type { Bathroom } from '../src/types';
import { isOpen } from '../src/utils/availability';

export default function HomeScreen() {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    minRating: 0,
    maxDistance: 5000,
    isOpenNow: false,
    is24Hours: false,
    isWheelchairAccessible: false,
    hasChangingTables: false,
  });
  const mapRef = useRef<MapView>(null);
  const [initialRegion, setInitialRegion] = useState<Region>({
    latitude: 47.6062,
    longitude: -122.3321,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  const { bathrooms, isLoading, error } = useBathrooms();
  const router = useRouter();

  useEffect(() => {
    console.log('=== DEBUG: Component Mount ===');
    console.log('Bathrooms:', bathrooms?.length);
    console.log('Is Loading:', isLoading);
    console.log('Error:', error);

    // If we have bathrooms data and the map is ready, ensure it's showing the right region
    if (bathrooms?.length > 0 && mapRef.current && !isLoading) {
      const coordinates = bathrooms.map(b => ({
        latitude: b.latitude,
        longitude: b.longitude,
      }));

      // Calculate the center point and deltas to fit all bathrooms
      const minLat = Math.min(...coordinates.map(c => c.latitude));
      const maxLat = Math.max(...coordinates.map(c => c.latitude));
      const minLng = Math.min(...coordinates.map(c => c.longitude));
      const maxLng = Math.max(...coordinates.map(c => c.longitude));

      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const latDelta = (maxLat - minLat) * 1.5; // 1.5 for some padding
      const lngDelta = (maxLng - minLng) * 1.5;

      const newRegion = {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: Math.max(0.1, latDelta), // Minimum zoom level
        longitudeDelta: Math.max(0.1, lngDelta),
      };

      console.log('Setting initial map region to fit all bathrooms:', newRegion);
      setInitialRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  }, [bathrooms, isLoading, error]);

  useEffect(() => {
    (async () => {
      console.log('=== DEBUG: Getting location permissions ===');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      
      if (status === 'granted') {
        try {
          console.log('Getting current location...');
          const location = await Location.getCurrentPositionAsync({});
          console.log('Location obtained:', location.coords);
          
          const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          };
          console.log('Setting new region:', newRegion);
          setInitialRegion(newRegion);
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
          }
        } catch (error) {
          console.error('Error getting location:', error);
        }
      }
    })();
  }, []);

  const renderMarker = (bathroom: Bathroom) => {
    console.log('=== DEBUG: Rendering marker for bathroom ===', bathroom.id);
    const rating = bathroom.averageRating || 0;
    return (
      <Marker
        key={`${bathroom.id}-${isLoading}`}
        identifier={bathroom.id}
        coordinate={{
          latitude: bathroom.latitude,
          longitude: bathroom.longitude,
        }}
        zIndex={1}
        onPress={() => {
          console.log('=== DEBUG: Marker pressed ===', bathroom.id);
          router.push({
            pathname: '/bathroom-details/[id]',
            params: { id: bathroom.id }
          });
        }}
      >
        <BathroomMarker 
          rating={rating} 
          isOpen={isOpen(bathroom)} 
        />
      </Marker>
    );
  };

  const onRegionChangeComplete = (region: Region) => {
    console.log('=== DEBUG: Map region changed ===');
    console.log('New region:', region);
    setCurrentRegion(region);
  };

  const getFilteredBathrooms = () => {
    if (!bathrooms) {
      console.log('No bathrooms data available');
      return [];
    }
    
    console.log('=== DEBUG: Filtering Bathrooms ===');
    console.log('Total bathrooms before filtering:', bathrooms.length);
    console.log('Active filters:', filters);

    // If no filters are active, return all bathrooms
    const hasActiveFilters = 
      filters.isOpenNow ||
      filters.isWheelchairAccessible ||
      filters.hasChangingTables ||
      filters.minRating > 0;

    if (!hasActiveFilters) {
      console.log('No active filters, returning all bathrooms');
      return bathrooms;
    }

    // Apply filters if any are active
    const filtered = bathrooms.filter(bathroom => {
      console.log('\nChecking bathroom:', bathroom.name);
      console.log('Hours data:', bathroom.hours);
      
      if (filters.isOpenNow) {
        const isCurrentlyOpen = isOpen(bathroom);
        console.log('isOpenNow check - isCurrentlyOpen:', isCurrentlyOpen);
        if (!isCurrentlyOpen) return false;
      }
      if (filters.isWheelchairAccessible && !bathroom.isAccessible) {
        console.log('Failed wheelchair check');
        return false;
      }
      if (filters.hasChangingTables && !bathroom.hasChangingTables) {
        console.log('Failed changing tables check');
        return false;
      }
      if (filters.minRating > 0 && bathroom.averageRating < filters.minRating) {
        console.log('Failed rating check');
        return false;
      }
      return true;
    });

    console.log('\nFiltered bathrooms count:', filtered.length);
    return filtered;
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={true}
          loadingEnabled={true}
          loadingIndicatorColor="#666666"
          loadingBackgroundColor="#eeeeee"
          moveOnMarkerPress={false}
        >
          {bathrooms && bathrooms.length > 0 && getFilteredBathrooms().map((bathroom) => {
            console.log('Rendering bathroom:', bathroom.id);
            return renderMarker(bathroom);
          })}
        </MapView>

        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setIsFilterVisible(true)}
          >
            <Ionicons name="options-outline" size={22} color="white" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/select-location')}
        >
          <Ionicons name="add" size={24} color="white" style={styles.addIcon} />
          <Text style={styles.addButtonText}>Add Bathroom</Text>
        </TouchableOpacity>

        <FilterSheet
          isVisible={isFilterVisible}
          onClose={() => setIsFilterVisible(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 999,
  },
  addIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#007AFF',
    fontWeight: '600',
  },
  errorOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
}); 