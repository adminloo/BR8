import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDOyTAfz18kSf2pi6Shar_wwFTNbvmiQ6A",
  projectId: "iosbr2",
  storageBucket: "iosbr2.firebasestorage.app",
  authDomain: "iosbr2.firebaseapp.com",
  messagingSenderId: "750017872566",
  appId: Platform.select({
    ios: "1:750017872566:ios:9286f6ab7183f8d6a1dc17",
    android: "1:750017872566:android:9286f6ab7183f8d6a1dc17"
  }),
  databaseURL: "https://iosbr2.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Connect to emulator in development
if (__DEV__) {
  try {
    console.log('Connecting to Firestore emulator...');
    // Use 127.0.0.1 instead of localhost for more reliable connection
    connectFirestoreEmulator(db, '127.0.0.1', 9090);
    console.log('Successfully connected to Firestore emulator');
  } catch (error) {
    console.error('Failed to connect to Firestore emulator:', error);
  }
} 