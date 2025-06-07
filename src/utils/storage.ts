import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * Storage keys enum to prevent hardcoding strings across the app
 */
export enum StorageKeys {
  LAST_SUBMISSION = 'lastBathroomSubmission',
  DEVICE_ID = 'deviceId',
  USER_SETTINGS = 'userSettings',
  AUTH_TOKEN = 'authToken',
  BATHROOM_CACHE_PREFIX = 'bathroom_'
}

/**
 * Encrypts a storage key to prevent key enumeration attacks
 */
const encryptKey = async (key: string): Promise<string> => {
  const namespace = 'com.loo1.br8';
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${namespace}:${key}`
  );
  return digest.substring(0, 32); // Use first 32 chars of hash
};

/**
 * Secure storage wrapper
 */
export const secureStorage = {
  async get(key: StorageKeys): Promise<string | null> {
    const encryptedKey = await encryptKey(key);
    return AsyncStorage.getItem(encryptedKey);
  },

  async set(key: StorageKeys, value: string): Promise<void> {
    const encryptedKey = await encryptKey(key);
    return AsyncStorage.setItem(encryptedKey, value);
  },

  async remove(key: StorageKeys): Promise<void> {
    const encryptedKey = await encryptKey(key);
    return AsyncStorage.removeItem(encryptedKey);
  },

  async clear(): Promise<void> {
    return AsyncStorage.clear();
  }
}; 