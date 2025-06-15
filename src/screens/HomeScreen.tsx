import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BathroomMarker } from '../components/BathroomMarker';
import { FilterSheet } from '../components/FilterSheet';
import { useBathrooms } from '../hooks/useBathrooms';
import type { Bathroom } from '../types';
import { isOpen } from '../utils/availability';

export const HomeScreen: React.FC = () => {
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
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const { bathrooms, isLoading, error } = useBathrooms();
  console.log('HomeScreen bathrooms:', bathrooms, 'isLoading:', isLoading, 'error:', error);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({});
          const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          };
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
    const rating = bathroom.averageRating || 0;
    return (
      <Marker
        key={bathroom.id}
        coordinate={{
          latitude: bathroom.latitude,
          longitude: bathroom.longitude,
        }}
        onPress={() => router.push({
          pathname: '/bathroom-details/[id]',
          params: { id: bathroom.id }
        })}
      >
        <BathroomMarker 
          rating={rating} 
          isOpen={isOpen(bathroom)} 
        />
      </Marker>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ position: 'absolute', top: 10, left: 0, right: 0, zIndex: 1000, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.push('/debug-config')}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#007AFF' }}>Loo</Text>
        </TouchableOpacity>
      </View>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
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
        {!isLoading && bathrooms && bathrooms
          .filter(bathroom => {
            if (filters.isOpenNow) {
              const isCurrentlyOpen = isOpen(bathroom);
              if (!isCurrentlyOpen) return false;
            }
            if (filters.isWheelchairAccessible && !bathroom.isAccessible) return false;
            if (filters.hasChangingTables && !bathroom.hasChangingTables) return false;
            if (filters.minRating > 0 && bathroom.averageRating < filters.minRating) return false;
            return true;
          })
          .map(renderMarker)}
      </MapView>

      <View 
        style={{ 
          position: 'absolute', 
          top: 60, 
          right: 20, 
          zIndex: 999,
          backgroundColor: 'transparent',
          width: 120,
          height: 50,
        }}
        onLayout={(event) => {
          console.log('Filter container layout:', event.nativeEvent.layout);
        }}
      >
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: '#007AFF' }]}
          onPress={() => {
            console.log('Filter button pressed');
            setIsFilterVisible(true);
          }}
        >
          <Ionicons name="options-outline" size={24} color="white" style={styles.filterIcon} />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/select-location')}
      >
        <Ionicons name="add" size={24} color="white" style={styles.addIcon} />
        <Text style={styles.addButtonText}>HELLO FROM DEV BUILD</Text>
      </TouchableOpacity>

      <FilterSheet
        isVisible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  map: {
    flex: 1,
  },
  filterButton: {
    position: 'absolute',
    top: 60,
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
  filterIcon: {
    marginRight: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
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
  },
}); 