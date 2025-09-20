/**
 * Rate Limiting Service for TankLog
 *
 * Provides rate limiting functionality for various operations,
 * particularly for reminder emails to prevent spam.
 */

import { createAdminClient } from '@/lib/supabase/server';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator: (identifier: string) => string; // Function to generate cache key
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Rate limiting configurations
export const RATE_LIMITS = {
  // Reminder emails: max 5 per hour per user
  reminderEmails: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyGenerator: (userId: string) => `reminder_emails:${userId}`,
  },

  // API calls: max 100 per hour per user
  apiCalls: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    keyGenerator: (userId: string) => `api_calls:${userId}`,
  },

  // Unsubscribe requests: max 10 per hour per IP
  unsubscribe: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (ip: string) => `unsubscribe:${ip}`,
  },
} as const;

export class RateLimitingService {
  private supabase = createAdminClient();

  /**
   * Check if a request is allowed under the given rate limit
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = config.keyGenerator(identifier);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Get existing rate limit data
      const { data: existingData, error: fetchError } = await this.supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // If it's not a "not found" error, something went wrong
        console.error('Rate limit fetch error:', fetchError);
        // Allow the request if we can't check the rate limit
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetTime: now + config.windowMs,
        };
      }

      if (!existingData) {
        // First request for this key
        await this.createRateLimitRecord(key, now);
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetTime: now + config.windowMs,
        };
      }

      // Check if the window has expired
      if (existingData.window_start < windowStart) {
        // Reset the window
        await this.resetRateLimitWindow(key, now);
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetTime: now + config.windowMs,
        };
      }

      // Check if we're within the limit
      if (existingData.request_count >= config.maxRequests) {
        const retryAfter = Math.ceil(
          (existingData.window_start + config.windowMs - now) / 1000
        );
        return {
          allowed: false,
          remaining: 0,
          resetTime: existingData.window_start + config.windowMs,
          retryAfter,
        };
      }

      // Increment the request count
      await this.incrementRequestCount(key, existingData.request_count + 1);

      return {
        allowed: true,
        remaining: config.maxRequests - existingData.request_count - 1,
        resetTime: existingData.window_start + config.windowMs,
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Allow the request if rate limiting fails
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }
  }

  /**
   * Create a new rate limit record
   */
  private async createRateLimitRecord(
    key: string,
    timestamp: number
  ): Promise<void> {
    const { error } = await this.supabase.from('rate_limits').insert({
      key,
      request_count: 1,
      window_start: timestamp,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to create rate limit record:', error);
    }
  }

  /**
   * Reset the rate limit window
   */
  private async resetRateLimitWindow(
    key: string,
    timestamp: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('rate_limits')
      .update({
        request_count: 1,
        window_start: timestamp,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key);

    if (error) {
      console.error('Failed to reset rate limit window:', error);
    }
  }

  /**
   * Increment the request count
   */
  private async incrementRequestCount(
    key: string,
    newCount: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('rate_limits')
      .update({
        request_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key);

    if (error) {
      console.error('Failed to increment request count:', error);
    }
  }

  /**
   * Clean up expired rate limit records
   */
  async cleanupExpiredRecords(): Promise<void> {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    const { error } = await this.supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', cutoffTime);

    if (error) {
      console.error('Failed to cleanup expired rate limit records:', error);
    }
  }

  /**
   * Get rate limit status for a specific identifier
   */
  async getRateLimitStatus(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = config.keyGenerator(identifier);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      const { data: existingData, error } = await this.supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .single();

      if (error || !existingData) {
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetTime: now + config.windowMs,
        };
      }

      // Check if the window has expired
      if (existingData.window_start < windowStart) {
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetTime: now + config.windowMs,
        };
      }

      const remaining = Math.max(
        0,
        config.maxRequests - existingData.request_count
      );
      const isAllowed = existingData.request_count < config.maxRequests;

      return {
        allowed: isAllowed,
        remaining,
        resetTime: existingData.window_start + config.windowMs,
        retryAfter: isAllowed
          ? undefined
          : Math.ceil(
              (existingData.window_start + config.windowMs - now) / 1000
            ),
      };
    } catch (error) {
      console.error('Rate limit status check error:', error);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
      };
    }
  }
}

// Export singleton instance
export const rateLimitingService = new RateLimitingService();
