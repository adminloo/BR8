const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "demo-project",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
connectFirestoreEmulator(db, 'localhost', 8080);

// Sample bathroom data
const sampleBathrooms = [
  {
    id: 'test-bathroom-1',
    name: 'Test Bathroom 1',
    latitude: 47.6062,
    longitude: -122.3321,
    isWheelchairAccessible: true,
    address: '123 Test St, Seattle, WA',
    description: 'A test bathroom in Seattle',
    businessType: 'cafe',
    ratingCount: 1,
    totalRating: 4,
  },
  {
    id: 'test-bathroom-2',
    name: 'Test Bathroom 2',
    latitude: 47.6205,
    longitude: -122.3493,
    isWheelchairAccessible: false,
    address: '456 Sample Ave, Seattle, WA',
    description: 'Another test bathroom in Seattle',
    businessType: 'restaurant',
    ratingCount: 2,
    totalRating: 8,
  }
];

async function seedData() {
  try {
    console.log('Starting to seed test data...');
    
    // Add bathrooms
    for (const bathroom of sampleBathrooms) {
      await setDoc(doc(db, 'bathrooms', bathroom.id), {
        ...bathroom,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Added bathroom: ${bathroom.name}`);
    }
    
    console.log('Successfully seeded test data!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData(); 