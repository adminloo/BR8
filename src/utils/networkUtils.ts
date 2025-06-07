import { FirebaseError } from 'firebase/app';

/**
 * Default timeout values (in milliseconds)
 */
const DEFAULT_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Wraps a promise with a timeout
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

/**
 * Implements exponential backoff for retries
 */
const getRetryDelay = (retryCount: number): number => {
  return Math.min(1000 * Math.pow(2, retryCount), 10000);
};

/**
 * Wraps a Firebase operation with timeout and retry logic
 */
export const withTimeoutAndRetry = async <T>(
  operation: () => Promise<T>,
  options: {
    timeoutMs?: number;
    maxRetries?: number;
    retryableErrors?: string[];
  } = {}
): Promise<T> => {
  const {
    timeoutMs = DEFAULT_TIMEOUT,
    maxRetries = MAX_RETRIES,
    retryableErrors = ['network-request-failed', 'deadline-exceeded']
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wrap the operation with timeout
      return await withTimeout(operation(), timeoutMs);
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry
      const isFirebaseError = error instanceof FirebaseError;
      const isRetryableError = isFirebaseError && 
        retryableErrors.includes((error as FirebaseError).code);
      
      if (attempt === maxRetries || !isRetryableError) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const delay = getRetryDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retrying operation, attempt ${attempt + 1} of ${maxRetries}`);
    }
  }

  throw lastError || new Error('Operation failed after retries');
};

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
  failures: number;
  lastFailure: number | null;
  isOpen: boolean;
}

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  maxFailures: number;
  resetTimeout: number;
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      maxFailures: 5,
      resetTimeout: 60000, // 1 minute
      ...config
    };

    this.state = {
      failures: 0,
      lastFailure: null,
      isOpen: false
    };
  }

  private shouldReset(): boolean {
    return this.state.isOpen && 
           this.state.lastFailure !== null && 
           (Date.now() - this.state.lastFailure) > this.config.resetTimeout;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.isOpen) {
      if (this.shouldReset()) {
        // Reset the circuit breaker
        this.state = {
          failures: 0,
          lastFailure: null,
          isOpen: false
        };
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      // Reset failures on success
      this.state.failures = 0;
      return result;
    } catch (error) {
      this.state.failures++;
      this.state.lastFailure = Date.now();
      
      if (this.state.failures >= this.config.maxFailures) {
        this.state.isOpen = true;
      }
      
      throw error;
    }
  }
} 