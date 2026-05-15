import Redis from 'ioredis';
import { headers } from 'next/headers';

// Create a Redis client
let redisClient = null;

// Initialize Redis connection
const getRedisClient = () => {
  if (redisClient) return redisClient;
  
  try {
    // Use the Redis URL from environment variables or use a default
    const redisUrl = 'redis://:' + process.env.REDIS_PASSWORD + '@' + process.env.REDIS_URL + ':6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 1000,
      lazyConnect: true,
    });
    
    // Handle connection errors
    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
      redisClient = null;
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
};

/**
 * Rate limiter configuration for different endpoints
 * Format: 
 * {
 *   'endpoint-name': { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute
 * }
 */
const limiters = {
  'default': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 requests per minute
  'booking': { windowMs: 60 * 1000, maxRequests: 40 }, // 40 requests per minute
  'payment': { windowMs: 30 * 1000, maxRequests: 5 },  // 5 requests per 30 seconds
  'newsletter': { windowMs: 5 * 60 * 1000, maxRequests: 10 }, // 10 requests per 5 minutes
  'products': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  'admin-login': { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 attempts per 15 minutes
};

/**
 * Get client IP address from request headers
 * @param {Object} request - Next.js request object
 * @returns {string} IP address
 */
export const getIpAddress = async () => {
  const headersList = await headers();
  
  // 1. Cloudflare's official client IP header
  const cfIp = headersList.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // 2. X-Forwarded-For (first IP is usually the client)
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // 3. Fallback
  const realIp = headersList.get('x-real-ip');
  if (realIp) return realIp;

  // Local dev fallback
  return '127.0.0.1';
};

/**
 * Check if the request is rate limited
 * @param {string} key - The rate limiter key (usually endpoint name)
 * @param {string} identifier - The client identifier (usually IP address)
 * @returns {Promise<Object>} Rate limit status
 */
const RATE_LIMIT_SCRIPT = `
  local key = KEYS[1]
  local window = tonumber(ARGV[1])
  local max = tonumber(ARGV[2])

  local count = redis.call('INCR', key)

  if count == 1 then
    redis.call('PEXPIRE', key, window)
  end

  local pttl = redis.call('PTTL', key)

  return { count, pttl }
`;

export const checkRateLimit = async (key, identifier) => {
  const limiter = limiters[key] || limiters.default;
  const { windowMs, maxRequests } = limiter;
  const redisKey = `ratelimit:${key}:${identifier}`;

  try {
    const redis = getRedisClient();
    if (!redis) {
      console.warn('Redis not available for rate limiting');
      return { success: true, remaining: 999, resetTime: Date.now() + windowMs };
    }

    const [count, pttl] = await redis.eval(
      RATE_LIMIT_SCRIPT,
      1,           // number of keys
      redisKey,    // KEYS[1]
      windowMs,    // ARGV[1]
      maxRequests  // ARGV[2]
    );

    const isLimited = count > maxRequests;

    return {
      success: !isLimited,
      limit: maxRequests,
      remaining: isLimited ? 0 : Math.max(0, maxRequests - count),
      resetTime: Date.now() + pttl
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { success: true, remaining: 999, resetTime: Date.now() + windowMs };
  }
};

/**
 * Middleware function to apply rate limiting to a request
 * @param {Object} request - Next.js request object
 * @param {string} key - The rate limiter key (endpoint name)
 * @returns {Promise<Object|Response>} Response object if rate limited, or null if allowed
 */
export const applyRateLimit = async (request, key = 'default') => {
  // Get client IP
  const ip = getIpAddress(request);
  
  // Check rate limit
  const limitResult = await checkRateLimit(key, ip);
  
  if (!limitResult.success) {
    // If rate limited, return a 429 response
    const resetTime = new Date(limitResult.resetTime).toUTCString();
    
    return Response.json(
      { 
        error: "Trop de requêtes. S'il vous plaît, ressayer plus tard",
        resetAt: resetTime
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((limitResult.resetTime - Date.now()) / 1000),
          'X-RateLimit-Limit': limitResult.limit,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': resetTime
        }
      }
    );
  }
  
  // Rate limit not exceeded, return null to continue processing the request
  return null;
};

/**
 * Wrap a handler function with rate limiting
 * @param {Function} handler - The request handler function
 * @param {string} key - The rate limiter key (endpoint name)
 * @returns {Function} Rate limited handler function
 */
export const withRateLimit = (handler, key = 'default') => {
  return async (request, context) => {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, key);
    
    // If rate limited, return the rate limit response
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Not rate limited, continue to the handler
    return handler(request, context);
  };
};

export default {
  applyRateLimit,
  withRateLimit,
  checkRateLimit,
  getIpAddress
};
