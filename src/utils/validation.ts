import DOMPurify from 'isomorphic-dompurify';

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

export function sanitizeText(text: string): string {
  if (!text) return '';
  // Remove HTML/script tags
  const cleanText = DOMPurify.sanitize(text.trim(), {
    ALLOWED_TAGS: [], // Remove all HTML tags
    ALLOWED_ATTR: [] // Remove all attributes
  });
  return cleanText;
}

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

export function validateReview(review: {
  comment: string;
  rating: number;
  tags?: string[];
}): ValidationResult {
  const errors: string[] = [];

  // Validate comment
  if (!review.comment || review.comment.trim().length === 0) {
    errors.push('Review comment is required');
  } else if (review.comment.length > 1000) {
    errors.push('Review comment must be less than 1000 characters');
  } else if (containsForbiddenContent(review.comment)) {
    errors.push('Review contains inappropriate content');
  }

  // Validate rating
  if (typeof review.rating !== 'number' || review.rating < 1 || review.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  // Validate tags
  if (review.tags) {
    if (!Array.isArray(review.tags)) {
      errors.push('Tags must be an array');
    } else {
      review.tags.forEach(tag => {
        if (containsForbiddenContent(tag)) {
          errors.push('One or more tags contain inappropriate content');
        }
      });
    }
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