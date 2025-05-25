import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Load environment variables
const env = Constants.expoConfig?.extra?.env || {};

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  projectId: env.FIREBASE_PROJECT_ID || 'demo-project',  // Fallback for emulator
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
});

// Connect to emulators in development
if (__DEV__) {
  console.log('Running in development mode');
  // Commenting out emulator connection to use production
  // try {
  //   const [host, port] = (env.FIRESTORE_EMULATOR_HOST || '10.0.0.99:9199').split(':');
  //   console.log(`Connecting to Firestore emulator at ${host}:${port}`);
  //   connectFirestoreEmulator(db, host, parseInt(port, 10));
  //   console.log('Successfully connected to Firestore emulator');
  // } catch (error) {
  //   console.error('Failed to connect to Firestore emulator:', error);
  // }
} else {
  console.log('Running in production mode');
}

export { db };
