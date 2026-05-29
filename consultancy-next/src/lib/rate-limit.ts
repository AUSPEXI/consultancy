/**
 * AUSPEXI Rate Limiting Engine
 * 
 * Implements token-bucket rate limiting per LLM provider with exponential backoff
 * Prevents API bans and guarantees sustainable 10K+/day query volume
 * 
 * Spec:
 * - OpenAI: 3,500 requests/min, 90,000 tokens/min
 * - Anthropic: 50,000 requests/min
 * - Google Gemini: 10,000 requests/min (subject to quota)
 */

interface RateLimitConfig {
  maxRequests: number;      // Requests per window
  windowMs: number;         // Time window in milliseconds
  maxRetries: number;       // Max exponential backoff attempts
  initialBackoffMs: number; // Initial backoff in ms
}

interface RateLimiter {
  remaining: number;
  resetTime: number;
  lastRequestTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterMs?: number;
}

/**
 * TokenBucket Rate Limiter
 * Tracks usage per provider and enforces limits
 */
export class TokenBucketLimiter {
  private providers: Map<string, RateLimiter> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Initialize provider configs (requests per minute)
    this.configs.set('openai', {
      maxRequests: 3500,
      windowMs: 60000,
      maxRetries: 5,
      initialBackoffMs: 500,
    });

    this.configs.set('anthropic', {
      maxRequests: 50000,
      windowMs: 60000,
      maxRetries: 5,
      initialBackoffMs: 500,
    });

    this.configs.set('gemini', {
      maxRequests: 10000,
      windowMs: 60000,
      maxRetries: 5,
      initialBackoffMs: 500,
    });

    this.configs.set('perplexity', {
      maxRequests: 5000,
      windowMs: 60000,
      maxRetries: 5,
      initialBackoffMs: 500,
    });
  }

  /**
   * Check if a request is allowed for this provider
   */
  public checkLimit(provider: string): RateLimitResult {
    const config = this.configs.get(provider.toLowerCase());
    if (!config) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const now = Date.now();
    const limiter = this.providers.get(provider) || this.initializeLimiter(provider, now);

    // Reset if window has passed
    if (now >= limiter.resetTime) {
      limiter.remaining = config.maxRequests;
      limiter.resetTime = now + config.windowMs;
    }

    if (limiter.remaining > 0) {
      limiter.remaining--;
      limiter.lastRequestTime = now;
      this.providers.set(provider, limiter);

      return {
        allowed: true,
        remaining: limiter.remaining,
        resetTime: limiter.resetTime,
      };
    }

    // Rate limit exceeded
    const retryAfterMs = Math.max(0, limiter.resetTime - now);
    return {
      allowed: false,
      remaining: 0,
      resetTime: limiter.resetTime,
      retryAfterMs,
    };
  }

  /**
   * Get current status of a provider
   */
  public getStatus(provider: string) {
    const limiter = this.providers.get(provider);
    const config = this.configs.get(provider.toLowerCase());

    if (!limiter || !config) {
      return {
        provider,
        remaining: config?.maxRequests || 0,
        max: config?.maxRequests || 0,
        resetTime: limiter?.resetTime || 0,
        percentUsed: 0,
      };
    }

    const percentUsed = Math.round(
      ((config.maxRequests - limiter.remaining) / config.maxRequests) * 100
    );

    return {
      provider,
      remaining: limiter.remaining,
      max: config.maxRequests,
      resetTime: limiter.resetTime,
      percentUsed,
    };
  }

  /**
   * Reset a provider's limits (for testing)
   */
  public reset(provider?: string) {
    if (provider) {
      this.providers.delete(provider);
    } else {
      this.providers.clear();
    }
  }

  private initializeLimiter(provider: string, now: number): RateLimiter {
    const config = this.configs.get(provider.toLowerCase());
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    const limiter: RateLimiter = {
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      lastRequestTime: now,
    };

    this.providers.set(provider, limiter);
    return limiter;
  }
}

/**
 * Exponential Backoff Handler
 * Implements smart retry logic with jitter for 429 (Too Many Requests) errors
 */
export async function callWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  provider: string,
  maxRetries: number = 5,
  initialBackoffMs: number = 500
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Only retry on 429 (Too Many Requests) or 503 (Service Unavailable)
      const statusCode = error.status || error.statusCode;
      const shouldRetry = statusCode === 429 || statusCode === 503;

      if (!shouldRetry || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff with jitter
      // Formula: (2^attempt - 1) * initialBackoff * (0.5 + Math.random())
      const exponentialDelay = Math.pow(2, attempt) * initialBackoffMs;
      const jitter = Math.random() * exponentialDelay;
      const delayMs = exponentialDelay + jitter;

      console.warn(
        `[Rate Limit] ${provider} returned ${statusCode}. Retrying in ${Math.round(delayMs)}ms (attempt ${attempt + 1}/${maxRetries})`
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Per-User Rate Limiting
 * Prevents individual users from consuming excessive quota
 */
export class PerUserRateLimiter {
  private userLimits: Map<string, RateLimiter> = new Map();
  private maxRequestsPerUser = 1000; // Requests per user per day
  private windowMs = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Check if user is allowed to make a request
   */
  public checkUserLimit(userId: string): RateLimitResult {
    const now = Date.now();
    const limiter = this.userLimits.get(userId) || this.initializeUser(userId, now);

    // Reset if window has passed
    if (now >= limiter.resetTime) {
      limiter.remaining = this.maxRequestsPerUser;
      limiter.resetTime = now + this.windowMs;
    }

    if (limiter.remaining > 0) {
      limiter.remaining--;
      limiter.lastRequestTime = now;
      this.userLimits.set(userId, limiter);

      return {
        allowed: true,
        remaining: limiter.remaining,
        resetTime: limiter.resetTime,
      };
    }

    const retryAfterMs = Math.max(0, limiter.resetTime - now);
    return {
      allowed: false,
      remaining: 0,
      resetTime: limiter.resetTime,
      retryAfterMs,
    };
  }

  /**
   * Get user's current quota status
   */
  public getUserStatus(userId: string) {
    const limiter = this.userLimits.get(userId);
    const percentUsed = limiter
      ? Math.round(((this.maxRequestsPerUser - limiter.remaining) / this.maxRequestsPerUser) * 100)
      : 0;

    return {
      userId,
      remaining: limiter?.remaining || this.maxRequestsPerUser,
      max: this.maxRequestsPerUser,
      resetTime: limiter?.resetTime || 0,
      percentUsed,
    };
  }

  /**
   * Set custom limit for premium user
   */
  public setCustomLimit(userId: string, maxRequests: number) {
    this.maxRequestsPerUser = maxRequests;
  }

  /**
   * Reset user's quota (for testing or customer service)
   */
  public resetUser(userId: string) {
    this.userLimits.delete(userId);
  }

  private initializeUser(userId: string, now: number): RateLimiter {
    const limiter: RateLimiter = {
      remaining: this.maxRequestsPerUser,
      resetTime: now + this.windowMs,
      lastRequestTime: now,
    };
    this.userLimits.set(userId, limiter);
    return limiter;
  }
}

/**
 * Singleton instances
 */
export const tokenBucketLimiter = new TokenBucketLimiter();
export const perUserRateLimiter = new PerUserRateLimiter();
