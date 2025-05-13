export interface FilterOptions {
  minRating: number;
  maxDistance: number;
  isOpenNow: boolean;
  is24Hours: boolean;
  isWheelchairAccessible: boolean;
  hasChangingTables: boolean;
}

export interface MapLocation {
  latitude: number;
  longitude: number;
}

export interface Bathroom {
  id: string;
  name: string;
  description: string;
  address?: string;
  latitude: number;
  longitude: number;
  isAccessible: boolean;
  hasChangingTables: boolean;
  requiresKey: boolean;
  source: 'user-submitted' | 'official';
  ratingCount: number;
  totalRating: number;
  averageRating: number;
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  hours?: {
    is24_7?: boolean;
    isUnsure?: boolean;
    schedule?: Record<string, { open: string; close: string; }>;
  };
  createdAt?: any;
  updatedAt?: any;
  cityId?: string;
  photos?: string[];
}

export type RootStackParamList = {
  Home: undefined;
  BathroomDetails: { bathroomId: string };
  SelectLocation: undefined;
  AddBathroom: { latitude: number; longitude: number };
}; 