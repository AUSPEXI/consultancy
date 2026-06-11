/**
 * Express Middleware for Rate Limiting
 * 
 * Automatically enforces per-user and per-provider rate limits
 * Integrates with the token bucket system
 */

import { Request, Response, NextFunction } from 'express';
import { tokenBucketLimiter, perUserRateLimiter } from '@/lib/rate-limit';

/**
 * Middleware: Check user rate limit
 * Add to Express routes that call LLMs
 */
export function checkUserRateLimit(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.uid || req.ip;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const limitCheck = perUserRateLimiter.checkUserLimit(userId);

  if (!limitCheck.allowed) {
    const resetDate = new Date(limitCheck.resetTime);
    return res.status(429).json({
      error: 'User rate limit exceeded',
      resetTime: resetDate.toISOString(),
      retryAfter: Math.ceil((limitCheck.resetTime - Date.now()) / 1000),
    });
  }

  // Attach rate limit info to request
  (req as any).rateLimit = {
    userId,
    remaining: limitCheck.remaining,
    resetTime: limitCheck.resetTime,
  };

  // Set response headers
  res.set('X-RateLimit-Remaining', String(limitCheck.remaining));
  res.set('X-RateLimit-Reset', String(limitCheck.resetTime));

  next();
}

/**
 * Middleware: Check provider rate limit
 * Validates rate limits for specific LLM provider
 */
export function checkProviderRateLimit(provider: 'openai' | 'anthropic' | 'gemini') {
  return (req: Request, res: Response, next: NextFunction) => {
    const limitCheck = tokenBucketLimiter.checkLimit(provider);

    if (!limitCheck.allowed) {
      const resetDate = new Date(limitCheck.resetTime);
      return res.status(429).json({
        error: `${provider} rate limit exceeded`,
        provider,
        resetTime: resetDate.toISOString(),
        retryAfter: Math.ceil((limitCheck.resetTime - Date.now()) / 1000),
      });
    }

    // Attach rate limit info to request
    (req as any).providerRateLimit = {
      provider,
      remaining: limitCheck.remaining,
      resetTime: limitCheck.resetTime,
    };

    // Set response headers
    res.set(`X-RateLimit-${provider}-Remaining`, String(limitCheck.remaining));
    res.set(`X-RateLimit-${provider}-Reset`, String(limitCheck.resetTime));

    next();
  };
}

/**
 * Middleware: Return rate limit status endpoint
 */
export function getRateLimitStatus(req: Request, res: Response) {
  const userId = (req as any).user?.uid;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const userStatus = perUserRateLimiter.getUserStatus(userId);
  const providers = {
    openai: tokenBucketLimiter.getStatus('openai'),
    anthropic: tokenBucketLimiter.getStatus('anthropic'),
    gemini: tokenBucketLimiter.getStatus('gemini'),
  };

  res.json({
    user: userStatus,
    providers,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Example usage in Express app:
 * 
 * app.post('/api/run-daily-audit', checkUserRateLimit, checkProviderRateLimit('gemini'), async (req, res) => {
 *   // Your audit logic here
 *   // Rate limits are already enforced
 * });
 * 
 * app.get('/api/rate-limit-status', checkUserRateLimit, getRateLimitStatus);
 */
