import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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