import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Load environment variables
const env = Constants.expoConfig?.extra?.env || {};

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_DATABASE_URL'
];

const missingVars = requiredEnvVars.filter(varName => !env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required Firebase environment variables:', missingVars);
  throw new Error('Missing required Firebase environment variables');
}

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: Platform.select({
    ios: env.FIREBASE_IOS_APP_ID,
    android: env.FIREBASE_ANDROID_APP_ID
  }),
  databaseURL: env.FIREBASE_DATABASE_URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // This helps with React Native compatibility
  cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache size
});

// Log configuration
console.log('Firebase initialized with project:', firebaseConfig.projectId);
console.log('Environment:', env.ENVIRONMENT || 'production');
console.log('Platform:', Platform.OS);
console.log('Using production database');
console.log('Firebase config at runtime:', firebaseConfig);
console.log('Env at runtime:', env);

export { db };
