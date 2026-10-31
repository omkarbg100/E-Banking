const { getRedis, cacheKey } = require("../Infrastructure/redis");
const logger = require("../Infrastructure/logger");

function idempotency(scope, ttlSeconds = 86400) {
  return async (req, res, next) => {
    const key = req.headers["idempotency-key"] || req.body?.idempotencyKey;
    if (!key) return next();

    const principal = req.user?.id || req.merchant?.merchantId || req.ip;
    const redisKey = cacheKey("idempotency", scope, String(principal), String(key));
    let redis;
    try {
      redis = getRedis();
    } catch {
      return next();
    }

    try {
      const claimed = await redis.set(redisKey, "PENDING", "EX", ttlSeconds, "NX");
      if (claimed !== "OK") {
        const existing = await redis.get(redisKey);
        if (!existing || existing === "PENDING") {
          return res
            .status(409)
            .json({ message: "A request with this idempotency key is already in progress" });
        }
        const cached = JSON.parse(existing);
        return res.status(cached.status).json(cached.body);
      }
    } catch (error) {
      logger.warn({ err: error.message }, "idempotency store unavailable");
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const status = res.statusCode;
      if (status < 500) {
        redis
          .set(redisKey, JSON.stringify({ status, body }), "EX", ttlSeconds)
          .catch((error) => logger.warn({ err: error.message }, "could not persist idempotent response"));
      } else {
        redis.del(redisKey).catch(() => {});
      }
      return originalJson(body);
    };

    res.on("close", () => {
      if (!res.writableEnded) {
        redis.del(redisKey).catch(() => {});
      }
    });

    return next();
  };
}

module.exports = idempotency;
