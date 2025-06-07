import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const lastFilterUpdate = useRef<number>(0);
  const filterUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
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
    // Only log if there's an error or loading state change
    if (error) {
      console.log('Error loading bathrooms:', error);
    }
  }, [bathrooms, isLoading, error]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
      }
    })();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (filterUpdateTimeout.current) {
        clearTimeout(filterUpdateTimeout.current);
      }
    };
  }, []);

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    const now = Date.now();
    
    // Clear any pending timeout
    if (filterUpdateTimeout.current) {
      clearTimeout(filterUpdateTimeout.current);
    }

    // If updates are happening too quickly, delay the update
    if (now - lastFilterUpdate.current < 100) {
      filterUpdateTimeout.current = setTimeout(() => {
        lastFilterUpdate.current = now;
        // Validate the new filters before applying them
        const validatedFilters = {
          ...newFilters,
          minRating: Math.max(0, Math.min(5, Number(newFilters.minRating) || 0)),
          maxDistance: Math.max(0, Number(newFilters.maxDistance) || 5000),
          isOpenNow: Boolean(newFilters.isOpenNow),
          is24Hours: Boolean(newFilters.is24Hours),
          isWheelchairAccessible: Boolean(newFilters.isWheelchairAccessible),
          hasChangingTables: Boolean(newFilters.hasChangingTables),
        };
        setFilters(validatedFilters);
      }, 100);
      return;
    }

    // Otherwise, update immediately
    lastFilterUpdate.current = now;
    const validatedFilters = {
      ...newFilters,
      minRating: Math.max(0, Math.min(5, Number(newFilters.minRating) || 0)),
      maxDistance: Math.max(0, Number(newFilters.maxDistance) || 5000),
      isOpenNow: Boolean(newFilters.isOpenNow),
      is24Hours: Boolean(newFilters.is24Hours),
      isWheelchairAccessible: Boolean(newFilters.isWheelchairAccessible),
      hasChangingTables: Boolean(newFilters.hasChangingTables),
    };
    setFilters(validatedFilters);
  }, []);

  const getFilteredBathrooms = useCallback(() => {
    if (!bathrooms) return [];
    
    // If no filters are active, return all bathrooms
    const hasActiveFilters = 
      filters.isOpenNow ||
      filters.isWheelchairAccessible ||
      filters.hasChangingTables ||
      filters.minRating > 0;

    if (!hasActiveFilters) return bathrooms;

    // Apply filters if any are active
    return bathrooms.filter(bathroom => {
      try {
        // Safely check properties with default values if undefined
        const isAccessible = bathroom.isAccessible ?? false;
        const hasChangingTables = bathroom.hasChangingTables ?? false;
        const averageRating = bathroom.averageRating ?? 0;
        
        if (filters.minRating > 0 && averageRating < filters.minRating) return false;
        if (filters.isOpenNow && !isOpen(bathroom)) return false;
        if (filters.isWheelchairAccessible && !isAccessible) return false;
        if (filters.hasChangingTables && !hasChangingTables) return false;
        
        return true;
      } catch (error) {
        console.error('Error filtering bathroom:', bathroom.name, error);
        return false;
      }
    });
  }, [bathrooms, filters]);

  const renderMarker = useCallback((bathroom: Bathroom) => {
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
          router.push({
            pathname: '/bathroom-details/[id]',
            params: { id: bathroom.id }
          });
        }}
      >
        <BathroomMarker 
          rating={bathroom.averageRating || 0} 
          isOpen={isOpen(bathroom)} 
        />
      </Marker>
    );
  }, [isLoading, router]);

  const onRegionChangeComplete = (region: Region) => {
    setCurrentRegion(region);
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
          {bathrooms && bathrooms.length > 0 && getFilteredBathrooms().map(renderMarker)}
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
          onFiltersChange={handleFiltersChange}
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