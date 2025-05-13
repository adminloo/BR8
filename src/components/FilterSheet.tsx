import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterOptions } from '../types';

interface FilterSheetProps {
  isVisible: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isVisible,
  onClose,
  filters,
  onFiltersChange,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { height } = Dimensions.get('window');
  
  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleFilterChange = (key: keyof FilterOptions, value: boolean | number) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [height, 0]
              })
            }]
          }
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.groupTitle}>Minimum Rating</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                style={styles.starButton}
                onPress={() => handleFilterChange('minRating', star)}
              >
                <Ionicons
                  name={star <= filters.minRating ? 'star' : 'star-outline'}
                  size={28}
                  color="#FFD700"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.groupTitle}>Availability</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.optionText}>Open Now</Text>
            <Switch
              value={filters.isOpenNow}
              onValueChange={(value) => handleFilterChange('isOpenNow', value)}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.optionText}>24/7 Access</Text>
            <Switch
              value={filters.is24Hours}
              onValueChange={(value) => handleFilterChange('is24Hours', value)}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.groupTitle}>Amenities</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.optionText}>Wheelchair Accessible</Text>
            <Switch
              value={filters.isWheelchairAccessible}
              onValueChange={(value) => handleFilterChange('isWheelchairAccessible', value)}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.optionText}>Changing Tables</Text>
            <Switch
              value={filters.hasChangingTables}
              onValueChange={(value) => handleFilterChange('hasChangingTables', value)}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={() =>
              onFiltersChange({
                minRating: 0,
                maxDistance: 5000,
                isOpenNow: false,
                is24Hours: false,
                isWheelchairAccessible: false,
                hasChangingTables: false,
              })
            }
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.applyButton]}
            onPress={onClose}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  starButton: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 16,
  },
  optionText: {
    fontSize: 17,
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  resetButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
}); 