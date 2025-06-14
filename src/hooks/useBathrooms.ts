import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { getBathroomsInBounds } from '../services/firebase';
import type { Bathroom } from '../types';
import { calculateDistance as getDistance } from '../utils/distance';

// Global state to track loaded bathrooms
let cachedBathrooms: Bathroom[] = [];
let isInitialLoadDone = false;

// Function to update the cache externally (used by App.tsx)
export function updateBathroomCache(bathrooms: Bathroom[]) {
  // Process bathrooms to ensure they match our expected format
  const processedBathrooms = bathrooms.map(bathroom => {
    const ratingCount = bathroom.ratingCount || 0;
    const totalRating = bathroom.totalRating || 0;
    const calculatedAverage = ratingCount > 0 ? totalRating / ratingCount : 0;
    
    return {
      ...bathroom,
      description: bathroom.description || '',
      ratingCount: ratingCount,
      totalRating: totalRating,
      averageRating: calculatedAverage,
      source: bathroom.source || 'user-submitted',
      isAccessible: !!bathroom.isAccessible,
      hasChangingTables: !!bathroom.hasChangingTables,
      requiresKey: !!bathroom.requiresKey,
    };
  });
  
  if (__DEV__) {
    console.log(`Cache updated with ${processedBathrooms.length} bathrooms`);
  }
  
  cachedBathrooms = processedBathrooms;
  isInitialLoadDone = true;
}

// Type guard for bathroom data
function isBathroom(data: any): data is Bathroom {
  return data && typeof data === 'object' && 'id' in data;
}

export function useBathrooms(options?: {
  location?: {
    latitude: number;
    longitude: number;
  };
}) {
  console.log('useBathrooms hook called', options);
  const [bathrooms, setBathrooms] = useState<Bathroom[]>(cachedBathrooms);
  const [isLoading, setIsLoading] = useState(!isInitialLoadDone);
  const [error, setError] = useState<string | null>(null);

  const loadBathrooms = async () => {
    if (isInitialLoadDone && cachedBathrooms.length > 0) {
      if (__DEV__) {
        console.log('Using cached bathrooms:', cachedBathrooms.length);
      }
      setBathrooms(cachedBathrooms);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({});
      const currentLat = location.coords.latitude;
      const currentLng = location.coords.longitude;
      
      // Calculate bounds around current location (roughly 10km radius)
      const latRange = 0.1; // approximately 10km
      const lngRange = 0.1 / Math.cos(currentLat * Math.PI / 180);
      
      const bathroomsData = await getBathroomsInBounds({
        ne: { 
          lat: currentLat + latRange,
          lng: currentLng + lngRange
        },
        sw: { 
          lat: currentLat - latRange,
          lng: currentLng - lngRange
        }
      });
      
      if (!bathroomsData || bathroomsData.length === 0) {
        if (__DEV__) {
          console.log('No bathrooms found in bounds');
        }
        setBathrooms([]);
        setIsLoading(false);
        return;
      }

      const validBathrooms = bathroomsData
        .filter(isBathroom)
        .map(bathroom => {
          const ratingCount = bathroom.ratingCount || 0;
          const totalRating = bathroom.totalRating || 0;
          const calculatedAverage = ratingCount > 0 ? totalRating / ratingCount : 0;
          
          return {
            ...bathroom,
            description: bathroom.description || '',
            ratingCount: ratingCount,
            totalRating: totalRating,
            averageRating: calculatedAverage,
            source: bathroom.source || 'user-submitted',
            isAccessible: !!bathroom.isAccessible,
            hasChangingTables: !!bathroom.hasChangingTables,
            requiresKey: !!bathroom.requiresKey,
          };
        });

      if (__DEV__) {
        console.log(`Loaded ${validBathrooms.length} bathrooms`);
      }

      isInitialLoadDone = true;
      cachedBathrooms = validBathrooms;
      setBathrooms(validBathrooms);
    } catch (error) {
      console.error('Error loading bathrooms:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to load bathrooms');
      }
      setBathrooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load bathrooms on mount only if not already loaded
  useEffect(() => {
    if (!isInitialLoadDone) {
      loadBathrooms();
    } else {
      setBathrooms(cachedBathrooms);
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this only runs once on mount

  // Filter bathrooms by location if provided
  const filteredBathrooms = options?.location
    ? bathrooms.filter(bathroom => {
        const distance = getDistance(
          options.location!.latitude,
          options.location!.longitude,
          bathroom.latitude,
          bathroom.longitude
        );
        return distance <= 10; // Show bathrooms within 10km
      })
    : bathrooms;

  return { 
    bathrooms: filteredBathrooms,
    isLoading, 
    error,
    reloadBathrooms: loadBathrooms
  };
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Update the bathroom type mapping
function mapBathroomData(data: any): Bathroom {
  // Convert hours to the correct format
  let hours = undefined;
  if (data.hours) {
    if (typeof data.hours === 'string') {
      if (data.hours === '24/7') {
        hours = { is24_7: true };
      } else if (data.hours === 'UNK') {
        hours = { isUnsure: true };
      } else {
        try {
          // Parse the schedule format from database
          // Example: "Saturday: 6 AM to 10 PM, Sunday: 6 AM to 10 PM, ..."
          const schedule: Record<string, { open: string; close: string }> = {};
          const hoursString = data.hours?.trim() || '';
          if (!hoursString) {
            hours = { isUnsure: true };
          } else {
            hoursString.split(', ').forEach((dayHour: string) => {
              if (!dayHour) return;
              const [day, timeRange] = dayHour.split(': ');
              if (!timeRange) return;
              
              const [openTime, closeTime] = timeRange.split(' to ');
              if (!openTime || !closeTime) return;
              
              const open = convertTo24Hour(openTime);
              const close = convertTo24Hour(closeTime);
              
              if (!open || !close) {
                console.error('Failed to convert time for day:', day, 'open:', openTime, 'close:', closeTime);
                return;
              }
              
              schedule[day.toLowerCase()] = { 
                open: open,
                close: close
              };
            });
            
            if (Object.keys(schedule).length > 0) {
              hours = { schedule };
              console.log('Parsed schedule:', schedule);
            } else {
              console.error('No valid schedule entries were parsed');
              hours = { isUnsure: true };
            }
          }
        } catch (e) {
          console.error('Error parsing hours:', e);
          hours = { isUnsure: true };
        }
      }
    } else if (typeof data.hours === 'object') {
      if ('monday' in data.hours) {
        // It's already in WeeklyHours format
        hours = data.hours;
      } else if (data.hours.is24_7) {
        hours = { is24_7: true };
      } else if (data.hours.schedule) {
        hours = { schedule: data.hours.schedule };
      } else if (data.hours.isUnsure) {
        hours = { isUnsure: true };
      } else {
        hours = { isUnsure: true };
      }
    }
  }

  return {
    id: data.id || '',
    name: data.name || 'Unnamed Location',
    description: data.description || '',
    latitude: Number(data.latitude || 0),
    longitude: Number(data.longitude || 0),
    isAccessible: Boolean(data.isAccessible || data.wheelchairAccessible || false),
    hasChangingTables: Boolean(data.changingTable || data.hasChangingTables || false),
    requiresKey: Boolean(data.requiresKey || false),
    source: data.source || 'user-submitted',
    ratingCount: Number(data.ratingCount || 1),
    totalRating: Number(data.totalRating || 3),
    averageRating: Number(data.averageRating || data.totalRating / data.ratingCount || 3),
    hours: hours || { isUnsure: true },
    cityId: data.cityId
  };
}

// Helper function to convert "4 AM" or "11:30 PM" to "04:00" or "23:30" format
export function convertTo24Hour(timeStr: string): string | null {
  try {
    const cleanTimeStr = timeStr.trim().toUpperCase();
    // Match formats like "6 AM", "10:30 PM", etc.
    const match = cleanTimeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
    if (!match) {
      console.error('Time string did not match expected format:', timeStr);
      return null;
    }

    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    const period = match[3];

    // Convert to 24-hour format
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  } catch (e) {
    console.error('Error converting time:', e, 'timeStr:', timeStr);
    return null;
  }
} 