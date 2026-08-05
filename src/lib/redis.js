import IORedis from "ioredis";

function getRedisConfig(overrides = {}) {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const isTls = url.startsWith("rediss://");
  return {
    keepAlive: 10000,
    connectTimeout: 10000,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    reconnectOnError: (err) => err.message.includes("READONLY"),
    maxRetriesPerRequest: null,
    ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    ...overrides,
  };
}

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = globalThis.redisClient || (globalThis.redisClient = new IORedis(redisUrl, getRedisConfig()));

export function createRedisClient(options = {}) {
  return new IORedis(redisUrl, getRedisConfig(options));
}
