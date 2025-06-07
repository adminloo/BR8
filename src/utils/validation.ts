import createDOMPurify from 'isomorphic-dompurify';
import { Platform } from 'react-native';
import type { NewBathroomData } from '../services/bathroomService';

// Initialize DOMPurify based on platform
const DOMPurify = Platform.OS === 'web' ? createDOMPurify(window) : createDOMPurify();

// List of forbidden words/patterns
const FORBIDDEN_WORDS = [
  'badword1',
  'badword2',
  // Add more as needed
];

// Regex patterns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  coordinates: {
    latitude: /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}$/,
    longitude: /^-?((1[0-7][0-9])|([1-9]?[0-9]))\.{1}\d{1,6}$/
  }
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Sanitize text input to prevent XSS
export const sanitizeText = (text: string | undefined): string => {
  if (!text) return '';
  try {
    return DOMPurify.sanitize(text.trim());
  } catch (error) {
    console.warn('DOMPurify sanitization failed:', error);
    // Fallback to basic sanitization if DOMPurify fails
    return text.trim()
      .replace(/[<>]/g, '') // Remove < and > characters
      .slice(0, 1000); // Limit length as a safety measure
  }
};

// Validate latitude
export const isValidLatitude = (lat: number): boolean => {
  return !isNaN(lat) && lat >= -90 && lat <= 90;
};

// Validate longitude
export const isValidLongitude = (lon: number): boolean => {
  return !isNaN(lon) && lon >= -180 && lon <= 180;
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate bathroom data
export const validateBathroomData = (data: NewBathroomData) => {
  const errors: string[] = [];

  // Required fields
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!isValidLatitude(data.latitude)) {
    errors.push('Invalid latitude value');
  }

  if (!isValidLongitude(data.longitude)) {
    errors.push('Invalid longitude value');
  }

  // Optional fields validation
  if (data.address && data.address.trim().length < 5) {
    errors.push('Address must be at least 5 characters long');
  }

  if (data.description && data.description.trim().length > 500) {
    errors.push('Description must not exceed 500 characters');
  }

  if (data.submitterEmail && !isValidEmail(data.submitterEmail)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate review data
export const validateReview = (data: {
  comment?: string;
  rating: number;
  tags?: string[];
}) => {
  const errors: string[] = [];

  // Validate rating
  if (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  // Validate comment if provided
  if (data.comment) {
    if (data.comment.trim().length < 2) {
      errors.push('Comment must be at least 2 characters long');
    }
    if (data.comment.trim().length > 1000) {
      errors.push('Comment must not exceed 1000 characters');
    }
  }

  // Validate tags if provided
  if (data.tags) {
    if (!Array.isArray(data.tags)) {
      errors.push('Tags must be an array');
    } else {
      if (data.tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
      }
      data.tags.forEach(tag => {
        if (typeof tag !== 'string' || tag.trim().length < 2 || tag.trim().length > 20) {
          errors.push('Each tag must be between 2 and 20 characters');
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate report data
export const validateReport = (data: {
  type: string;
  details: string;
  bathroomId: string;
}) => {
  const errors: string[] = [];

  if (!data.type || !['INAPPROPRIATE', 'INCORRECT', 'CLOSED', 'OTHER'].includes(data.type)) {
    errors.push('Invalid report type');
  }

  if (!data.details || data.details.trim().length < 10) {
    errors.push('Report details must be at least 10 characters long');
  }

  if (data.details && data.details.trim().length > 1000) {
    errors.push('Report details must not exceed 1000 characters');
  }

  if (!data.bathroomId || data.bathroomId.trim().length === 0) {
    errors.push('Bathroom ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export function validateCoordinates(latitude: number, longitude: number): ValidationResult {
  const errors: string[] = [];
  
  if (latitude < -90 || latitude > 90) {
    errors.push('Latitude must be between -90 and 90 degrees');
  }
  if (longitude < -180 || longitude > 180) {
    errors.push('Longitude must be between -180 and 180 degrees');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function containsForbiddenContent(text: string): boolean {
  if (!text) return false;
  const normalizedText = text.toLowerCase();
  return FORBIDDEN_WORDS.some(word => normalizedText.includes(word.toLowerCase()));
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!PATTERNS.email.test(email)) {
    errors.push('Invalid email format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateBathroom(bathroom: {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validate name
  if (!bathroom.name || bathroom.name.trim().length === 0) {
    errors.push('Bathroom name is required');
  } else if (bathroom.name.length > 100) {
    errors.push('Bathroom name must be less than 100 characters');
  }

  // Validate description
  if (bathroom.description && bathroom.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }

  // Validate coordinates
  const coordValidation = validateCoordinates(bathroom.latitude, bathroom.longitude);
  errors.push(...coordValidation.errors);

  // Check for forbidden content
  if (containsForbiddenContent(bathroom.name) || 
      (bathroom.description && containsForbiddenContent(bathroom.description))) {
    errors.push('Content contains inappropriate language');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 