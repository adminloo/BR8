import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface BathroomMarkerProps {
  rating: number;
  isOpen: boolean;
}

export const BathroomMarker: React.FC<BathroomMarkerProps> = ({ rating, isOpen }) => {
  const getMarkerColor = () => {
    if (!isOpen) return '#FF3B30'; // Red for closed
    if (rating >= 4) return '#34C759'; // Green for high rating
    if (rating >= 3) return '#FF9500'; // Orange for medium rating
    return '#FF3B30'; // Red for low rating
  };

  const color = getMarkerColor();

  return (
    <View style={styles.container}>
      <View style={[styles.marker, { backgroundColor: color }]}>
        <Ionicons 
          name="water" 
          size={10} 
          color="white" 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    position: 'relative',
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -10 },
      { translateY: -10 }
    ],
  },
}); 