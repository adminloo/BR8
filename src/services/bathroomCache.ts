import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_EXPIRY = 1000 * 60 * 15; // 15 minutes

export class BathroomCache {
  static async get(key: string) {
    try {
      const cached = await AsyncStorage.getItem(`bathroom_${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(`bathroom_${key}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  static async set(key: string, data: any) {
    try {
      await AsyncStorage.setItem(`bathroom_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }
} 