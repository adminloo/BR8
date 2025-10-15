import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddressInput } from '../components/AddressInput';
import { useBathrooms } from '../hooks/useBathrooms';
import { findNearbyBathrooms } from '../utils/distance';

export const SelectLocationScreen: React.FC = () => {
  const [markerLocation, setMarkerLocation] = useState({
    latitude: 47.6062,
    longitude: -122.3321,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const { bathrooms } = useBathrooms();

  const [useMap, setUseMap] = useState(true);

  useEffect(() => {
    (async () => {
      if (!useMap) return;
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location services are not enabled. You can still add a bathroom by entering an address manually.');
        setUseMap(false);
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({});
        setMarkerLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 1000);
        }
      } catch (error) {
        setErrorMsg('Could not get current location. You can still add a bathroom by entering an address manually.');
        setUseMap(false);
      }
    })();
  }, [useMap]);

  const handleMapPress = (e: any) => {
    setMarkerLocation(e.nativeEvent.coordinate);
  };

  const handleConfirmLocation = () => {
    if (errorMsg) {
      Alert.alert('Error', errorMsg);
      return;
    }

    // Check for nearby bathrooms
    const nearbyBathrooms = bathrooms ? findNearbyBathrooms(
      markerLocation.latitude,
      markerLocation.longitude,
      bathrooms
    ) : [];

    if (nearbyBathrooms.length > 0) {
      const nearestBathroom = nearbyBathrooms[0];
      Alert.alert(
        'Similar Bathroom Found',
        'There is already a bathroom registered within 50 meters of this location. Would you like to view it instead?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'View Existing',
            onPress: () => {
              router.replace(`/bathroom-details/${nearestBathroom.id}`);
            },
          },
          {
            text: 'Add Anyway',
            onPress: () => {
              router.push({
                pathname: '/add-bathroom',
                params: { 
                  latitude: markerLocation.latitude,
                  longitude: markerLocation.longitude
                }
              });
            },
          },
        ]
      );
      return;
    }
    
    router.push({
      pathname: '/add-bathroom',
      params: { 
        latitude: markerLocation.latitude,
        longitude: markerLocation.longitude
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <AddressInput onLocationSelected={setMarkerLocation} mapRef={mapRef} />
      </View>

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={{
            latitude: markerLocation.latitude,
            longitude: markerLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          onPress={handleMapPress}
        >
          <Marker
            coordinate={markerLocation}
            draggable
            onDragEnd={(e) => setMarkerLocation(e.nativeEvent.coordinate)}
          />
        </MapView>

        <View style={styles.overlay}>
          <Text style={styles.instructions}>
            Drag the pin to adjust the exact location
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirmLocation}
      >
        <Text style={styles.confirmButtonText}>Confirm Location</Text>
        <Ionicons name="arrow-forward" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
  },
  errorText: {
    color: '#D00',
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
  },
  confirmButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
}); 