const Redis = require("ioredis");

function createRedis(url = process.env.REDIS_URL || "redis://localhost:6379", options = {}) {
  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
    ...options
  });
  client.on("error", (err) => {
    if (process.env.NODE_ENV !== "test") {
      console.error("redis error", err.message);
    }
  });
  return client;
}

async function waitForRedis(client, attempts = 60, delayMs = 1000) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await client.ping();
      return;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = { createRedis, waitForRedis };
