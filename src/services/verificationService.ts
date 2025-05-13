export class VerificationService {
  static async reportIssue(bathroomId: string, issue: {
    type: 'CLOSED' | 'WRONG_HOURS' | 'WRONG_LOCATION' | 'ACCESS_CHANGED';
    details: string;
  }) {
    // Implementation
  }

  static async verifyBathroom(bathroomId: string, data: {
    status: Bathroom['status'];
    operatingHours?: Bathroom['operatingHours'];
    photos?: string[];
  }) {
    // Implementation
  }

  static async getVerificationNeeded() {
    // Get bathrooms not verified in last 30 days
    // Or with recent issue reports
  }
} 