const { ApiError } = require("./errors");

async function enforceRateLimit({ redis, key, limit, windowSeconds }) {
  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, windowSeconds);
  if (current > limit) {
    const retryAfter = await redis.ttl(key);
    throw new ApiError(429, "Too many requests", { retryAfter: retryAfter > 0 ? retryAfter : windowSeconds });
  }
}

function rateLimit({ redis, scope, limit, windowSeconds, keyFn }) {
  return async (req, res, next) => {
    try {
      const identity = keyFn ? keyFn(req) : req.ip;
      const key = `rl:${scope}:${identity}`;
      await enforceRateLimit({ redis, key, limit, windowSeconds });
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { enforceRateLimit, rateLimit };
