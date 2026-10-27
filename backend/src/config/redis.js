import Redis from "ioredis";

let redisClient = null;
let isRedisAvailable = false;

const connectRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    redisClient = new Redis(redisUrl, {
      // Retry strategy: exponential backoff, max 2s between retries
      retryStrategy(times) {
        if (times > 3) {
          console.warn("⚠️  Redis unavailable — continuing without cache");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      enableReadyCheck: true,
    });

    redisClient.on("connect", () => {
      console.log("🔄 Redis connecting...");
    });

    redisClient.on("ready", () => {
      isRedisAvailable = true;
      console.log("✅ Redis connected and ready");
    });

    redisClient.on("error", (err) => {
      isRedisAvailable = false;
      // Only log once to avoid spamming
      if (err.code !== "ECONNREFUSED") {
        console.error(`🔴 Redis error: ${err.message}`);
      }
    });

    redisClient.on("end", () => {
      isRedisAvailable = false;
      console.warn("🟡 Redis connection closed");
    });

    return redisClient;
  } catch (error) {
    console.warn(`⚠️  Redis init failed: ${error.message}`);
    console.warn("   → App will continue without caching");
    return null;
  }
};

// ─── Cache helper functions ─────────────────────────────────────
export const getCache = async (key) => {
  if (!redisClient || !isRedisAvailable) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Cache GET error [${key}]:`, err.message);
    return null;
  }
};

export const setCache = async (key, value, ttlSeconds = 300) => {
  if (!redisClient || !isRedisAvailable) return false;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Cache SET error [${key}]:`, err.message);
    return false;
  }
};

export const deleteCache = async (key) => {
  if (!redisClient || !isRedisAvailable) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.error(`Cache DEL error [${key}]:`, err.message);
    return false;
  }
};

export const deleteCachePattern = async (pattern) => {
  if (!redisClient || !isRedisAvailable) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
    return true;
  } catch (err) {
    console.error(`Cache DEL pattern error [${pattern}]:`, err.message);
    return false;
  }
};

export const isRedisReady = () => isRedisAvailable;
export const getRedisClient = () => redisClient;

export default connectRedis;
