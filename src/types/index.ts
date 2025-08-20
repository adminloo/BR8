export type MapLocation = {
  latitude: number;
  longitude: number;
};

export type FilterOptions = {
  minRating: number;
  maxDistance: number;
  isOpenNow: boolean;
  is24Hours: boolean;
  isWheelchairAccessible: boolean;
  hasChangingTables: boolean;
};

export interface Bathroom {
  id: string;
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  isAccessible: boolean;
  hasChangingTables: boolean;
  requiresKey: boolean;
  source: 'user-submitted' | 'official';
  ratingCount: number;
  totalRating: number;
  averageRating?: number;
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  hours?: {
    is24_7?: boolean;
    isUnsure?: boolean;
    schedule?: Record<string, { open: string; close: string; }>;
  };
  createdAt?: any;
  updatedAt?: any;
  verifiedAt?: any;
  cityId?: string;
  photos?: string[];
  // New fields for safe approval process
  publicId?: number;
  sourcePendingId?: string;
}

export interface Review {
  id: string;
  bathroomId: string;
  rating: number;
  comment: string;
  createdAt: Date | number;
  tags?: string[];
}

export type RootStackParamList = {
  Home: undefined;
  AddBathroom: { location: MapLocation };
  SelectLocation: undefined;
  BathroomDetails: { bathroomId: string };
};

export interface Report {
  id: string;
  bathroomId: string;
  type: string;
  description: string;
  timestamp: Date;
  rating?: number;
  comment?: string;
}

export type MapBounds = {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
};