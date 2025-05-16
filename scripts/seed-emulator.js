const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "iosbr2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
connectFirestoreEmulator(db, 'localhost', 8080);

const sampleBathrooms = [
  {
    id: "10",
    name: "Magnolia Community Center",
    description: "Public restroom in community center",
    latitude: 47.6389,
    longitude: -122.3991,
    isAccessible: true,
    hasChangingTables: false,
    requiresKey: false,
    source: "official",
    ratingCount: 1,
    totalRating: 3,
    averageRating: 3,
    hours: {
      monday: { open: "09:00", close: "21:00", isClosed: false },
      tuesday: { open: "09:00", close: "21:00", isClosed: false },
      wednesday: { open: "09:00", close: "21:00", isClosed: false },
      thursday: { open: "09:00", close: "21:00", isClosed: false },
      friday: { open: "09:00", close: "21:00", isClosed: false },
      saturday: { open: "09:00", close: "17:00", isClosed: false },
      sunday: { open: "09:00", close: "17:00", isClosed: false },
      is24_7: false,
      isUnsure: false
    },
    cityId: "Seattle"
  },
  {
    id: "11",
    name: "Green Lake Park",
    description: "Public park restroom",
    latitude: 47.6805,
    longitude: -122.3427,
    isAccessible: true,
    hasChangingTables: true,
    requiresKey: false,
    source: "official",
    ratingCount: 2,
    totalRating: 8,
    averageRating: 4,
    hours: {
      is24_7: true
    },
    cityId: "Seattle"
  },
  {
    id: "12",
    name: "Pike Place Market",
    description: "Market public restroom",
    latitude: 47.6097,
    longitude: -122.3422,
    isAccessible: true,
    hasChangingTables: true,
    requiresKey: false,
    source: "official",
    ratingCount: 3,
    totalRating: 12,
    averageRating: 4,
    hours: {
      monday: { open: "08:00", close: "18:00", isClosed: false },
      tuesday: { open: "08:00", close: "18:00", isClosed: false },
      wednesday: { open: "08:00", close: "18:00", isClosed: false },
      thursday: { open: "08:00", close: "18:00", isClosed: false },
      friday: { open: "08:00", close: "18:00", isClosed: false },
      saturday: { open: "08:00", close: "18:00", isClosed: false },
      sunday: { open: "08:00", close: "18:00", isClosed: false },
      is24_7: false,
      isUnsure: false
    },
    cityId: "Seattle"
  }
];

async function seedData() {
  try {
    console.log('Starting to seed data...');
    
    for (const bathroom of sampleBathrooms) {
      await setDoc(doc(db, 'bathrooms', bathroom.id), bathroom);
      console.log(`Added bathroom: ${bathroom.name}`);
    }
    
    console.log('Finished seeding data!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedData(); 