const Redis = require("ioredis");
const env = require("../Config/env");
const logger = require("./logger");

let client = null;

function createClient() {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      return Math.min(times * 200, 3000);
    }
  });

  redis.on("error", (error) => {
    logger.warn({ err: error.message }, "redis error");
  });

  return redis;
}

async function connectRedis() {
  if (client) return client;
  client = createClient();
  await client.connect();
  await client.ping();
  logger.info("redis connected");
  return client;
}

function getRedis() {
  if (!client) throw new Error("Redis has not been initialised");
  return client;
}

function cacheKey(...parts) {
  return [env.REDIS_PREFIX, ...parts].join(":");
}

async function getJSON(key) {
  const value = await getRedis().get(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function setJSON(key, value, ttlSeconds) {
  const serialised = JSON.stringify(value);
  if (ttlSeconds) return getRedis().set(key, serialised, "EX", ttlSeconds);
  return getRedis().set(key, serialised);
}

async function invalidate(...keys) {
  if (keys.length === 0) return;
  await getRedis().del(...keys);
}

async function closeRedis() {
  if (!client) return;
  await client.quit();
  client = null;
}

module.exports = {
  connectRedis,
  getRedis,
  cacheKey,
  getJSON,
  setJSON,
  invalidate,
  closeRedis
};
