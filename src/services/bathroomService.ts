import {
    addDoc,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    increment,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getDeviceId } from '../utils/ipHash';
import { CircuitBreaker, withTimeoutAndRetry } from '../utils/networkUtils';
import { sanitizeText, validateBathroomData, validateReport, validateReview } from '../utils/validation';

export interface NewBathroomData {
  name: string;
  latitude: number;
  longitude: number;
  isWheelchairAccessible: boolean;
  address?: string;
  description?: string;
  submittedByUserId?: string;
  businessType?: string;
  submitterEmail?: string;  // Optional email of person submitting
  submitterNotes?: string;  // Any additional notes from submitter
}

export interface BathroomDocument extends NewBathroomData {
  source: 'user' | 'official';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: any; // Firestore Timestamp
  lastVerified: any | null; // Firestore Timestamp
  adminNotes?: string; // Notes from admin verification
  googleMapsUrl?: string; // Generated Google Maps URL for easy verification
  verificationCount?: number;
  verifiedBy?: string[];
  reports?: {
    count: number;
    reasons: string[];
  };
}

export interface Review {
  id: string;
  bathroomId: string;
  rating: number;
  comment?: string;
  createdAt: Date | number;
  tags?: string[];
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

// Create circuit breakers for different operations
const addBathroomCircuitBreaker = new CircuitBreaker();
const addReviewCircuitBreaker = new CircuitBreaker();
const addReportCircuitBreaker = new CircuitBreaker();

export class BathroomService {
  static async checkRateLimit(): Promise<boolean> {
    try {
      const deviceId = await getDeviceId();
      const rateLimitRef = doc(db, 'rateLimits', deviceId);
      const rateLimitDoc = await getDoc(rateLimitRef);

      const now = new Date();
      const data = rateLimitDoc.exists() ? rateLimitDoc.data() : null;

      if (data && data.lastSubmission) {
        const lastSubmission = data.lastSubmission.toDate();
        const timeDiff = (now.getTime() - lastSubmission.getTime()) / 1000;
        
        if (timeDiff < 90) {
          throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(90 - timeDiff)} seconds before submitting.`);
        }
      }

      // Update rate limit document
      await setDoc(rateLimitRef, {
        deviceId,
        lastSubmission: serverTimestamp(),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error; // Re-throw rate limit errors
      }
      console.error('Error checking rate limit:', error);
      return false;
    }
  }

  static async addBathroom(cityId: string, data: NewBathroomData) {
    return addBathroomCircuitBreaker.execute(async () => {
      return await withTimeoutAndRetry(async () => {
        try {
          // Validate input data
          const validation = validateBathroomData(data);
          if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }

          // Sanitize text inputs
          const sanitizedData = {
            ...data,
            name: sanitizeText(data.name),
            address: sanitizeText(data.address),
            description: sanitizeText(data.description),
            submitterNotes: sanitizeText(data.submitterNotes),
            businessType: sanitizeText(data.businessType)
          };

          // Check rate limit
          await this.checkRateLimit();

          const deviceId = await getDeviceId();
          
          // Add the bathroom with sanitized data
          const bathroomRef = collection(db, 'bathrooms');
          const newId = await getNextBathroomId(db);
          
          const bathRoomWithMetadata = {
            ...sanitizedData,
            id: newId,
            cityId,
            status: 'PENDING',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            deviceId
          };

          const docRef = doc(bathroomRef, newId);
          await setDoc(docRef, bathRoomWithMetadata);
          
          return newId;
        } catch (error) {
          console.error('Error adding bathroom:', error);
          throw error;
        }
      });
    });
  }

  static async getBathrooms(cityId: string, options?: {
    verificationStatus?: string;
    source?: string;
  }) {
    const bathroomsRef = collection(db, `cities/${cityId}/bathrooms`);
    let q = query(bathroomsRef);
    
    if (options?.verificationStatus) {
      q = query(q, where('verificationStatus', '==', options.verificationStatus));
    }
    
    if (options?.source) {
      q = query(q, where('source', '==', options.source));
    }
    
    return getDocs(q);
  }

  static async verifyBathroom(cityId: string, bathroomId: string, userId: string) {
    const bathroomRef = doc(db, `cities/${cityId}/bathrooms/${bathroomId}`);
    
    return await updateDoc(bathroomRef, {
      verificationStatus: 'verified',
      lastVerified: serverTimestamp(),
      verifiedBy: arrayUnion(userId),
      verificationCount: increment(1)
    });
  }

  static async reportBathroom(cityId: string, bathroomId: string, reason: string) {
    const bathroomRef = doc(db, `cities/${cityId}/bathrooms/${bathroomId}`);
    
    return await updateDoc(bathroomRef, {
      'reports.count': increment(1),
      'reports.reasons': arrayUnion(reason)
    });
  }

  static async getPendingBathrooms(cityId: string) {
    return this.getBathrooms(cityId, { verificationStatus: 'pending' });
  }

  static async getVerifiedBathrooms(cityId: string) {
    return this.getBathrooms(cityId, { verificationStatus: 'verified' });
  }

  static async addReview(reviewData: Omit<Review, 'id' | 'createdAt'>) {
    return addReviewCircuitBreaker.execute(async () => {
      return await withTimeoutAndRetry(async () => {
        try {
          // Validate review data
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

          // Check rate limit
          await this.checkRateLimit();

          const db = getFirestore();
          const batch = writeBatch(db);
          
          // Add the review
          const reviewRef = doc(collection(db, 'reviews'));
          const timestamp = serverTimestamp();
          
          batch.set(reviewRef, {
            ...sanitizedData,
            bathroomId: sanitizedData.bathroomId,
            createdAt: timestamp
          });

          // Update the bathroom ratings
          const bathroomRef = doc(db, 'bathrooms', sanitizedData.bathroomId);
          
          await runTransaction(db, async (transaction) => {
            const bathroomDoc = await transaction.get(bathroomRef);
            if (!bathroomDoc.exists()) {
              throw new Error('Bathroom not found');
            }

            const data = bathroomDoc.data();
            const newRatingCount = (data.ratingCount || 0) + 1;
            const newTotalRating = (data.totalRating || 0) + sanitizedData.rating;

            transaction.update(bathroomRef, {
              ratingCount: newRatingCount,
              totalRating: newTotalRating,
              updatedAt: timestamp,
            });
          });

          await batch.commit();
          return reviewRef.id;
        } catch (error) {
          console.error('Error adding review:', error);
          throw error;
        }
      });
    });
  }

  static async addReport(report: {
    bathroomId: string;
    type: string;
    details: string;
  }) {
    return addReportCircuitBreaker.execute(async () => {
      return await withTimeoutAndRetry(async () => {
        try {
          // Validate report data
          const validation = validateReport(report);
          if (!validation.isValid) {
            throw new Error(`Invalid report: ${validation.errors.join(', ')}`);
          }

          // Sanitize the data
          const sanitizedData = {
            ...report,
            details: sanitizeText(report.details)
          };

          // Check rate limit
          await this.checkRateLimit();

          const reportsRef = collection(db, 'reports');
          await addDoc(reportsRef, {
            ...sanitizedData,
            status: 'PENDING',
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          console.error('Error adding report:', error);
          throw error;
        }
      });
    });
  }
} 