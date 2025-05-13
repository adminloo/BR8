import {
    addDoc,
    collection,
    doc,
    getDocs,
    getFirestore,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Bathroom, Review } from '../types/index';

// Since we can't use GeoFirestore directly with the new Firebase modular SDK,
// let's implement our own geospatial queries
export async function getBathroomsInBounds(bounds: {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
}) {
  try {
    console.log('=== DEBUG: Fetching bathrooms in bounds ===');
    console.log('Bounds:', bounds);

    const bathroomsRef = collection(db, 'bathrooms');
    const bathroomsQuery = query(
      bathroomsRef,
      where('latitude', '>=', bounds.sw.lat),
      where('latitude', '<=', bounds.ne.lat)
    );
    
    console.log('Executing Firestore query...');
    const bathroomsSnapshot = await getDocs(bathroomsQuery);
    console.log(`Found ${bathroomsSnapshot.size} bathrooms in latitude range`);
    
    if (bathroomsSnapshot.empty) {
      console.log('No bathrooms found in the specified bounds');
      return [];
    }

    // Map and filter results
    const bathrooms = bathroomsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Bathroom));
    
    // Filter by longitude in memory
    const filteredBathrooms = bathrooms.filter(bathroom => 
      bathroom.longitude >= bounds.sw.lng && 
      bathroom.longitude <= bounds.ne.lng
    );

    console.log('Total bathrooms after longitude filtering:', filteredBathrooms.length);
    return filteredBathrooms;
  } catch (error) {
    console.error('Error getting bathrooms:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if ('code' in error) {
        console.error('Error code:', (error as any).code);
      }
    }
    throw error;
  }
}

// Update getBathroomsInRadius to accept cityId
export async function getBathroomsInRadius(
  center: {
    latitude: number;
    longitude: number;
  }, 
  radiusKm: number = 2,
  cityId: string = 'BostonFinal'  // Default to Boston
) {
  const lat = center.latitude;
  const lon = center.longitude;
  const latRange = radiusKm / 111.32;
  const lonRange = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));

  const bounds = {
    ne: { 
      lat: lat + latRange,
      lng: lon + lonRange
    },
    sw: {
      lat: lat - latRange,
      lng: lon - lonRange
    }
  };

  const bathrooms = await getBathroomsInBounds(bounds);

  return bathrooms.filter(bathroom => {
    const distance = calculateDistance(
      center.latitude,
      center.longitude,
      bathroom.latitude,
      bathroom.longitude
    );
    return distance <= radiusKm;
  });
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Add this function to add a default review
async function addDefaultReview(bathroomId: string, cityPath: string) {
  try {
    await addReview({
      bathroomId,
      rating: 3,
      comment: "Initial system rating",
      isSystemGenerated: true
    });
  } catch (error) {
    console.error('Error adding default review:', error);
  }
}

// Function to generate the next bathroom ID
async function getNextBathroomId(db: any): Promise<string> {
  const pendingRef = collection(db, 'pendingBathrooms');
  const q = query(pendingRef, where('id', '>=', '425'), where('id', '<', '426'));
  const snapshot = await getDocs(q);
  
  // Find the highest number after 425
  let maxNum = 0;
  snapshot.docs.forEach(doc => {
    const id = doc.id;
    if (id.startsWith('425')) {
      const num = parseInt(id.substring(3));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  
  return `425${maxNum + 1}`;
}

export async function addBathroom(bathroomData: Partial<Bathroom>, cityId: string) {
  try {
    const db = getFirestore();
    const pendingRef = collection(db, 'pendingBathrooms');
    
    // Get the next available ID
    const newId = await getNextBathroomId(db);
    
    const bathRoomWithMetadata = {
      ...bathroomData,
      id: newId, // Store the ID in the document as well
      cityId,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Use the generated ID when creating the document
    const docRef = doc(pendingRef, newId);
    await setDoc(docRef, bathRoomWithMetadata);
    
    return newId;
  } catch (error) {
    console.error('Error adding bathroom:', error);
    throw error;
  }
}

export async function addReview(reviewData: Omit<Review, 'id' | 'createdAt'>) {
  try {
    const db = getFirestore();
    const batch = writeBatch(db);
    
    // Add the review
    const reviewRef = doc(collection(db, 'reviews'));
    batch.set(reviewRef, {
      ...reviewData,
      bathroomId: reviewData.bathroomId,
      createdAt: serverTimestamp(),
      isSystemGenerated: reviewData.isSystemGenerated || false,
    });

    // Update the bathroom ratings
    const bathroomRef = doc(db, 'bathrooms', reviewData.bathroomId);
    
    // Use a transaction for the rating update
    await runTransaction(db, async (transaction) => {
      const bathroomDoc = await transaction.get(bathroomRef);
      if (!bathroomDoc.exists()) {
        throw new Error('Bathroom not found');
      }

      const data = bathroomDoc.data();
      const newRatingCount = (data.ratingCount || 0) + 1;
      const newTotalRating = (data.totalRating || 0) + reviewData.rating;

      transaction.update(bathroomRef, {
        ratingCount: newRatingCount,
        totalRating: newTotalRating,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return reviewRef.id;
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
}

// Helper function to determine city from bathroom ID
function getCityFromBathroomId(id: string): string {
  if (id.startsWith('B')) return 'Boston';
  if (id.startsWith('C')) return 'Chicago';
  return 'Seattle';
}

export async function getReviews(bathroomId: string): Promise<Review[]> {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('bathroomId', '==', bathroomId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(reviewsQuery);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      let createdAt: Date;

      // Handle different timestamp formats
      if (data.createdAt?.toDate) {
        // Firestore Timestamp
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt) {
        // String timestamp
        createdAt = new Date(data.createdAt);
      } else {
        // Fallback
        createdAt = new Date();
      }

      return {
        id: doc.id,
        bathroomId: data.bathroomId,
        rating: data.rating,
        comment: data.comment || '',
        createdAt,
        tags: data.tags || [],
        isSystemGenerated: data.isSystemGenerated || false,
      };
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    throw error;
  }
}

export const addReport = async (report: {
  bathroomId: string;
  type: string;
  details: string;
  timestamp: Date;
}) => {
  const reportsRef = collection(db, 'reports');
  await addDoc(reportsRef, {
    ...report,
    status: 'PENDING',
    createdAt: serverTimestamp(),
  });
}; 