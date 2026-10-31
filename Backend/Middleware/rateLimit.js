const { getRedis, cacheKey } = require("../Infrastructure/redis");
const logger = require("../Infrastructure/logger");

function rateLimit({ limit, windowSeconds, prefix, keyGenerator, message }) {
  return async (req, res, next) => {
    try {
      const identity = keyGenerator ? keyGenerator(req) : req.ip;
      if (!identity) return next();

      const key = cacheKey("ratelimit", prefix, identity);
      const redis = getRedis();
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);

      res.setHeader("x-ratelimit-limit", limit);
      res.setHeader("x-ratelimit-remaining", Math.max(0, limit - count));

      if (count > limit) {
        res.setHeader("retry-after", windowSeconds);
        return res.status(429).json({
          message: message || "Too many requests. Please try again later."
        });
      }
      return next();
    } catch (error) {
      logger.warn({ err: error.message }, "rate limiter unavailable; allowing request");
      return next();
    }
  };
}

module.exports = rateLimit;
