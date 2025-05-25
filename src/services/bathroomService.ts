import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, increment, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getDeviceId } from '../utils/ipHash';

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
    try {
      console.log('\n=== RATE LIMIT CHECK START ===');
      const deviceId = await getDeviceId();
      console.log('📱 Device:', deviceId.substring(0, 8) + '...');
      
      // Check rate limit first
      const rateLimitRef = doc(db, 'rateLimits', deviceId);
      const rateLimitDoc = await getDoc(rateLimitRef);
      
      const now = new Date();
      if (rateLimitDoc.exists()) {
        const data = rateLimitDoc.data();
        if (data.lastSubmission) {
          const lastSubmission = data.lastSubmission.toDate();
          const timeDiff = (now.getTime() - lastSubmission.getTime()) / 1000;
          console.log('⏱️ Time since last submission:', Math.round(timeDiff), 'seconds');
          
          if (timeDiff < 90) {
            const waitTime = Math.ceil(90 - timeDiff);
            console.log('🚫 Rate limit active. Wait time:', waitTime, 'seconds');
            console.log('=== RATE LIMIT CHECK END ===\n');
            throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before submitting.`);
          }
        }
      } else {
        console.log('✨ First submission for this device');
      }

      console.log('✅ Rate limit check passed');
      console.log('=== RATE LIMIT CHECK END ===\n');

      // Update rate limit first and wait for it to complete
      await setDoc(rateLimitRef, {
        deviceId,
        lastSubmission: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // Wait a moment to ensure the rate limit document is properly saved
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then add the bathroom with deviceId
      const bathroomRef = collection(db, 'bathrooms');
      const docRef = await addDoc(bathroomRef, {
        ...data,
        deviceId,
        cityId,
        source: 'user-submitted',
        verificationStatus: 'pending',
        createdAt: serverTimestamp(),
        lastVerified: null,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`
      });

      return docRef;
    } catch (error) {
      console.error('Error in addBathroom:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to add bathroom');
    }
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
} 