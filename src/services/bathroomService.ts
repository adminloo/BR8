import { addDoc, arrayUnion, collection, doc, getDocs, increment, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';

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
  static async addBathroom(cityId: string, data: NewBathroomData) {
    const bathroomRef = collection(db, 'bathrooms');
    
    // Generate Google Maps URL for easy verification
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`;
    
    const docRef = await addDoc(bathroomRef, {
      ...data,
      cityId, // Store cityId as a field instead of in the path
      source: 'user-submitted',
      verificationStatus: 'pending',
      createdAt: serverTimestamp(),
      lastVerified: null,
      googleMapsUrl
    });

    // The actual email sending will be handled by a Firebase Cloud Function
    // that triggers when a new bathroom document is created
    
    return docRef;
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