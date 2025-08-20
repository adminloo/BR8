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
  updateDoc,
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
  const bathroomsRef = collection(db, 'bathrooms');
  
  // Check both collections for existing IDs to avoid conflicts
  const pendingQuery = query(pendingRef, where('id', '>=', '425'), where('id', '<', '426'));
  const bathroomsQuery = query(bathroomsRef, where('id', '>=', '425'), where('id', '<', '426'));
  
  const [pendingSnapshot, bathroomsSnapshot] = await Promise.all([
    getDocs(pendingQuery),
    getDocs(bathroomsQuery)
  ]);
  
  // Find the highest number across both collections
  let maxNum = 0;
  
  pendingSnapshot.docs.forEach(doc => {
    const id = doc.id;
    if (id.startsWith('425')) {
      const num = parseInt(id.substring(3));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  
  bathroomsSnapshot.docs.forEach(doc => {
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

// Function to get next public ID for bathrooms collection
async function getNextPublicBathroomId(db: any): Promise<number> {
  const counterRef = doc(db, 'counters', 'bathrooms');
  
  return await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);
    const current = (snap.exists() ? snap.data()!.nextId : 42533) as number; // seed to your last known + 1
    const next = current + 1;
    transaction.set(counterRef, { nextId: next }, { merge: true });
    return current;
  });
}

// Safe approval function that prevents ID collisions
export async function approvePendingBathroom(pendingId: string): Promise<string> {
  try {
    const db = getFirestore();
    const pendingRef = doc(db, 'pendingBathrooms', pendingId);
    
    // Get the pending bathroom data
    const pendingDoc = await getDoc(pendingRef);
    if (!pendingDoc.exists()) {
      throw new Error(`Pending bathroom ${pendingId} not found`);
    }
    
    const pendingData = pendingDoc.data();
    const now = serverTimestamp();
    
    // Get a new public ID for the bathrooms collection
    const publicId = await getNextPublicBathroomId(db);
    
    // Create a new bathroom document with auto-generated ID
    const bathroomsRef = doc(collection(db, 'bathrooms'));
    
    // Prepare the approved bathroom data
    const approvedBathroomData = {
      ...pendingData,
      id: bathroomsRef.id, // Use the auto-generated Firestore ID
      publicId: publicId, // Store the numeric public ID
      status: 'VERIFIED',
      sourcePendingId: pendingId, // Traceability back to pending record
      createdAt: pendingData.createdAt || now,
      updatedAt: now,
      verifiedAt: now,
      // Ensure required fields are present
      ratingCount: pendingData.ratingCount || 0,
      totalRating: pendingData.totalRating || 0,
      averageRating: pendingData.averageRating || 0,
      source: pendingData.source || 'user-submitted',
      isAccessible: Boolean(pendingData.isAccessible),
      hasChangingTables: Boolean(pendingData.hasChangingTables),
      requiresKey: Boolean(pendingData.requiresKey),
    };
    
    // Use a transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
      // Create the new bathroom document
      transaction.set(bathroomsRef, approvedBathroomData);
      
      // Delete the pending document
      transaction.delete(pendingRef);
    });
    
    console.log(`Successfully approved pending bathroom ${pendingId} -> ${bathroomsRef.id} (publicId: ${publicId})`);
    return bathroomsRef.id;
    
  } catch (error) {
    console.error('Error approving pending bathroom:', error);
    throw error;
  }
}

// Function to reject a pending bathroom
export async function rejectPendingBathroom(pendingId: string, reason?: string): Promise<void> {
  try {
    const db = getFirestore();
    const pendingRef = doc(db, 'pendingBathrooms', pendingId);
    
    // Get the pending bathroom data
    const pendingDoc = await getDoc(pendingRef);
    if (!pendingDoc.exists()) {
      throw new Error(`Pending bathroom ${pendingId} not found`);
    }
    
    const now = serverTimestamp();
    
    // Update the pending document to mark it as rejected
    await updateDoc(pendingRef, {
      status: 'REJECTED',
      updatedAt: now,
      rejectedAt: now,
      rejectionReason: reason || 'Rejected by admin',
    });
    
    console.log(`Successfully rejected pending bathroom ${pendingId}`);
    
  } catch (error) {
    console.error('Error rejecting pending bathroom:', error);
    throw error;
  }
}

// Function to get all pending bathrooms (for admin review)
export async function getPendingBathrooms(): Promise<any[]> {
  try {
    const db = getFirestore();
    const pendingRef = collection(db, 'pendingBathrooms');
    const q = query(pendingRef, where('status', '==', 'PENDING'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting pending bathrooms:', error);
    throw error;
  }
}

// Function to validate cityId against coordinates (data quality check)
export function validateCityCoordinates(latitude: number, longitude: number, cityId: string): {
  isValid: boolean;
  suggestedCityId?: string;
  warning?: string;
} {
  // Basic coordinate validation
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { isValid: false, warning: 'Invalid coordinates' };
  }
  
  // City-specific coordinate validation (basic examples)
  const cityBounds: Record<string, { lat: [number, number], lng: [number, number] }> = {
    'seattle': { lat: [47.5, 47.8], lng: [-122.5, -122.2] },
    'chicago': { lat: [41.6, 42.1], lng: [-87.9, -87.5] },
    // Add more cities as needed
  };
  
  const bounds = cityBounds[cityId.toLowerCase()];
  if (bounds) {
    const [minLat, maxLat] = bounds.lat;
    const [minLng, maxLng] = bounds.lng;
    
    if (latitude < minLat || latitude > maxLat || longitude < minLng || longitude > maxLng) {
      // Coordinates don't match the city
      return {
        isValid: false,
        warning: `Coordinates (${latitude}, ${longitude}) don't match city ${cityId}`,
        suggestedCityId: 'unknown' // You could implement reverse geocoding here
      };
    }
  }
  
  return { isValid: true };
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