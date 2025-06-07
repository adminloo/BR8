import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Bathroom } from '../types';
import { sanitizeText, validateReview } from '../utils/validation';

export interface Review {
  id: string;
  bathroomId: string;
  rating: number;
  comment?: string;
  createdAt: Date | number;
  tags?: string[];
}

// Since we can't use GeoFirestore directly with the new Firebase modular SDK,
// let's implement our own geospatial queries
export async function getBathroomsInBounds(bounds: {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
}) {
  if (__DEV__) {
    console.log('=== DEBUG: Fetching bathrooms in bounds ===');
    console.log('Bounds:', bounds);
  }

  try {
    const bathroomsRef = collection(db, 'bathrooms');
    const q = query(
      bathroomsRef,
      where('latitude', '<=', bounds.ne.lat),
      where('latitude', '>=', bounds.sw.lat)
    );

    if (__DEV__) {
      console.log('Executing Firestore query...');
    }

    const querySnapshot = await getDocs(q);
    const bathrooms = querySnapshot.docs
      .map(doc => {
        const data = doc.data() as Omit<Bathroom, 'id'>;
        return {
          ...data,
          id: doc.id
        };
      })
      .filter(bathroom => 
        bathroom.longitude >= bounds.sw.lng && 
        bathroom.longitude <= bounds.ne.lng
      );

    if (__DEV__) {
      console.log(`Found ${querySnapshot.docs.length} total bathrooms`);
      console.log(`Total bathrooms after filtering: ${bathrooms.length}`);
    }

    return bathrooms;
  } catch (error) {
    console.error('Error fetching bathrooms:', error);
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
    // Validate and sanitize input
    const validation = validateReview({
      comment: reviewData.comment,
      rating: reviewData.rating,
      tags: reviewData.tags
    });

    if (!validation.isValid) {
      throw new Error(`Invalid review: ${validation.errors.join(', ')}`);
    }

    // Sanitize the data
    const sanitizedData = {
      ...reviewData,
      comment: sanitizeText(reviewData.comment),
      tags: reviewData.tags?.map(tag => sanitizeText(tag))
    };

    const db = getFirestore();
    
    // Add the review and update bathroom in a transaction
    await runTransaction(db, async (transaction) => {
      // Add the review
      const reviewRef = doc(collection(db, 'reviews'));
      const timestamp = serverTimestamp();
      
      transaction.set(reviewRef, {
        ...sanitizedData,
        bathroomId: sanitizedData.bathroomId,
        createdAt: timestamp
      });

      // Update the bathroom ratings
      const bathroomRef = doc(db, 'bathrooms', sanitizedData.bathroomId);
      const bathroomDoc = await transaction.get(bathroomRef);
      
      if (!bathroomDoc.exists()) {
        throw new Error('Bathroom not found');
      }

      const data = bathroomDoc.data();
      const newRatingCount = (data.ratingCount || 0) + 1;
      const newTotalRating = (data.totalRating || 0) + sanitizedData.rating;
      const newAverageRating = newTotalRating / newRatingCount;

      transaction.update(bathroomRef, {
        ratingCount: newRatingCount,
        totalRating: newTotalRating,
        averageRating: newAverageRating,
        updatedAt: timestamp
      });

      return reviewRef.id;
    });
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
      let createdAt: Date | number;

      // Handle different timestamp formats
      if (data.createdAt?.toDate) {
        // Firestore Timestamp
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt) {
        // Unix timestamp
        createdAt = typeof data.createdAt === 'number' ? 
          data.createdAt : 
          new Date(data.createdAt).getTime();
      } else {
        // Fallback to current timestamp
        createdAt = Date.now();
      }

      return {
        id: doc.id,
        bathroomId: data.bathroomId,
        rating: data.rating,
        comment: data.comment || '',
        createdAt,
        tags: data.tags || []
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

export async function getBathroom(bathroomId: string): Promise<Bathroom | null> {
  try {
    const bathroomRef = doc(db, 'bathrooms', bathroomId);
    const bathroomDoc = await getDoc(bathroomRef);
    
    if (!bathroomDoc.exists()) {
      return null;
    }
    
    const data = bathroomDoc.data();
    const ratingCount = data.ratingCount || 0;
    const totalRating = data.totalRating || 0;
    const calculatedAverage = ratingCount > 0 ? totalRating / ratingCount : 0;
    
    return {
      id: bathroomDoc.id,
      name: data.name || '',
      description: data.description || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      isAccessible: !!data.isAccessible,
      hasChangingTables: !!data.hasChangingTables,
      requiresKey: !!data.requiresKey,
      source: data.source || 'user-submitted',
      ratingCount: ratingCount,
      totalRating: totalRating,
      averageRating: calculatedAverage,
      hours: data.hours,
      address: data.address,
      status: data.status,
      cityId: data.cityId,
      photos: data.photos,
    };
  } catch (error) {
    console.error('Error getting bathroom:', error);
    throw error;
  }
} 