import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Load environment variables
const env = Constants.expoConfig?.extra?.env || {};

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
});

// Production mode logging
console.log('Running in production mode with project:', firebaseConfig.projectId);

export { db };
