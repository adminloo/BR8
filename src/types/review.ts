export interface Review {
  id: string;
  bathroomId: string;
  rating: number;
  comment: string;
  timestamp: string;
  tags: string[];
  createdAt: Date;
  isSystemGenerated: boolean;
} 