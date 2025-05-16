const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');

// Production Firebase config
const prodApp = initializeApp({
  apiKey: "AIzaSyDOyTAfz18kSf2pi6Shar_wwFTNbvmiQ6A",
  projectId: "iosbr2",
  storageBucket: "iosbr2.firebasestorage.app",
  authDomain: "iosbr2.firebaseapp.com",
  messagingSenderId: "750017872566",
}, 'production');

// Emulator Firebase config
const emulatorApp = initializeApp({
  projectId: "iosbr2",
}, 'emulator');

// Get both Firestore instances
const prodDb = getFirestore(prodApp);
const emulatorDb = getFirestore(emulatorApp);

// Connect emulator DB to local emulator
connectFirestoreEmulator(emulatorDb, '127.0.0.1', 9090);

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
      const docRef = doc(emulatorDb, 'bathrooms', docSnapshot.id);
      await setDoc(docRef, bathroomData);
      copied++;
      console.log(`Copied bathroom ${copied}/${bathroomsSnapshot.size}: ${bathroomData.name || 'Unnamed'}`);
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