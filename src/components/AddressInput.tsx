import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface AddressInputProps {
  onLocationSelected: (location: { latitude: number; longitude: number }) => void;
  mapRef?: any;
}

interface SearchResult {
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export const AddressInput: React.FC<AddressInputProps> = ({ onLocationSelected, mapRef }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Known landmarks with exact addresses
  const landmarks = {
    'everett public library': {
      name: 'Everett Public Library',
      address: '2702 Hoyt Ave, Everett, WA 98201',
      location: {
        latitude: 47.97772,
        longitude: -122.20865
      }
    },
    // Add more landmarks as needed
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    // Set new timeout to debounce the search
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Check for known landmarks first
        const lowercaseText = text.toLowerCase();
        const matchedLandmark = Object.entries(landmarks).find(([key]) => 
          lowercaseText.includes(key)
        );

        if (matchedLandmark) {
          const [_, landmark] = matchedLandmark;
          setSearchResults([{
            name: landmark.name,
            address: landmark.address,
            location: landmark.location
          }]);
          setIsSearching(false);
          return;
        }

        // If no landmark match, proceed with regular search
        const searchText = `${text}, WA`;
        const locations = await Location.geocodeAsync(searchText);
        
        if (locations && locations.length > 0) {
          // Get more details about each location
          const detailedResults = await Promise.all(
            locations.map(async (loc) => {
              const [placeDetails] = await Location.reverseGeocodeAsync({
                latitude: loc.latitude,
                longitude: loc.longitude,
              });

              // Only include results in Washington State
              if (placeDetails.region === 'Washington' || placeDetails.region === 'WA') {
                const cityState = placeDetails.city ? `${placeDetails.city}, WA` : 'WA';
                return {
                  name: placeDetails.name || text,
                  address: [
                    placeDetails.street,
                    cityState,
                    placeDetails.postalCode
                  ].filter(Boolean).join(', '),
                  location: {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                  },
                };
              }
              return null;
            })
          );

          // Filter out null results and limit to 5 results
          setSearchResults(detailedResults.filter(Boolean).slice(0, 5));
        }
      } catch (error) {
        console.error('Error searching locations:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Reduced debounce time for better responsiveness

    setSearchTimeout(timeout);
  };

  const handleSelectLocation = (result: SearchResult) => {
    onLocationSelected(result.location);
    setSearchResults([]);
    setSearchQuery(result.name);

    // Animate map to the selected location
    if (mapRef?.current) {
      mapRef.current.animateToRegion({
        latitude: result.location.latitude,
        longitude: result.location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search for a location..."
          placeholderTextColor="#666"
        />
        {isSearching && <ActivityIndicator style={styles.loader} />}
      </View>

      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelectLocation(item)}
            >
              <Ionicons name="location" size={20} color="#007AFF" style={styles.locationIcon} />
              <View style={styles.resultTextContainer}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultAddress}>{item.address}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  loader: {
    marginLeft: 10,
  },
  resultsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  resultItem_last: {
    borderBottomWidth: 0,
  },
  locationIcon: {
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
  },
});
