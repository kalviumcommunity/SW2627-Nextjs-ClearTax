import IORedis from "ioredis";
import { env } from "./env.js";

/**
 * Generates the robust Redis connection options following ioredis & BullMQ best practices.
 */
const getRedisConfig = (customOptions = {}) => {
  const isTls = env.REDIS_URL.startsWith("rediss://");
  
  return {
    keepAlive: 10000,          // Periodically pings the connection (TCP KeepAlive) to prevent idle timeouts
    connectTimeout: 10000,     // Timeout after 10s if connection cannot be established
    retryStrategy(times) {
      // Reconnect strategy with exponential delay capped at 3000ms
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    reconnectOnError(err) {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;           // Automatically reconnect if connection becomes read-only
      }
      return false;
    },
    ...(isTls ? { tls: { rejectUnauthorized: false } } : {}), // Auto-TLS for production rediss:// protocols
    ...customOptions,
  };
};

/**
 * Registers production log events on the Redis client.
 */
function registerLogging(client) {
  client.on("connect", () => {
    console.log("✓ Redis Connected");
  });
  client.on("ready", () => {
    console.log("✓ Redis Ready");
  });
  client.on("reconnecting", () => {
    console.log("✓ Redis Reconnecting");
  });
  client.on("close", () => {
    console.log("✓ Redis Closed");
  });
  client.on("error", (err) => {
    console.error("✓ Redis Error:", err.message);
  });
}

// Instantiate the primary client for general usage (like Express routing/injections)
export const redis = new IORedis(env.REDIS_URL, getRedisConfig({ maxRetriesPerRequest: null }));
registerLogging(redis);

/**
 * Client factory for creating clean, isolated Redis client connections.
 * Essential for BullMQ Workers/QueueEvents that block connections.
 */
export function createRedisClient(customOptions = {}) {
  const client = new IORedis(env.REDIS_URL, getRedisConfig({
    maxRetriesPerRequest: null,
    ...customOptions
  }));
  registerLogging(client);
  return client;
}

/**
 * Closes the primary Redis connection gracefully.
 */
export async function closeRedis() {
  try {
    if (redis.status !== "end") {
      await redis.quit();
    }
    console.log("🔌 Redis Main Client Disconnected Gracefully");
  } catch (error) {
    console.error("❌ Redis Main Client Disconnection Error:", error.message);
  }
}
