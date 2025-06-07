require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');

// Production Firebase config
const prodApp = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
}, 'production');

// Emulator Firebase config
const emulatorApp = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
}, 'emulator');

// Get both Firestore instances
const prodDb = getFirestore(prodApp);
const emulatorDb = getFirestore(emulatorApp);

// Connect emulator DB to local emulator with bypass token
connectFirestoreEmulator(emulatorDb, '127.0.0.1', 9199);

async function copyBathrooms() {
  try {
    console.log('Starting to copy bathrooms from production...');
    
    // Get all bathrooms from production
    const bathroomsSnapshot = await getDocs(collection(prodDb, 'bathrooms'));
    
    console.log(`Found ${bathroomsSnapshot.size} bathrooms in production`);
    
    // Copy each bathroom to emulator
    let copied = 0;
    for (const docSnapshot of bathroomsSnapshot.docs) {
      const bathroomData = docSnapshot.data();
      // Add required fields for security rules
      const enhancedData = {
        ...bathroomData,
        ipHash: 'development',
        spam: false,
      };
      const docRef = doc(emulatorDb, 'bathrooms', docSnapshot.id);
      await setDoc(docRef, enhancedData);
      copied++;
      console.log(`Copied bathroom ${copied}/${bathroomsSnapshot.size}: ${enhancedData.name || 'Unnamed'}`);
    }
    
    console.log('Finished copying bathrooms!');
    console.log(`Successfully copied ${copied} bathrooms to emulator`);
    
    // Exit the process since we're done
    process.exit(0);
  } catch (error) {
    console.error('Error copying bathrooms:', error);
    process.exit(1);
  }
}

// Start the copy process
copyBathrooms(); 