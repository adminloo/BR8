import AsyncStorage from '@react-native-async-storage/async-storage';
import { createHash } from 'crypto';
import { Platform } from 'react-native';

export async function getDeviceId(): Promise<string> {
  // Try to get existing device ID from storage
  const existingId = await AsyncStorage.getItem('deviceId');
  if (existingId) {
    return existingId;
  }

  // Generate a new device ID if none exists
  const deviceInfo = {
    platform: Platform.OS,
    version: Platform.Version,
    brand: Platform.select({ ios: 'Apple', android: 'Android' }),
    timestamp: new Date().toISOString().split('T')[0], // Just the date part
  };

  const deviceId = createHash('sha256')
    .update(JSON.stringify(deviceInfo))
    .digest('hex');

  // Store the device ID for future use
  await AsyncStorage.setItem('deviceId', deviceId);
  return deviceId;
} 