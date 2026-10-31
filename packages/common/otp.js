const crypto = require("crypto");
const { ApiError } = require("./errors");
const { hmac, safeEqual } = require("./crypto");

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp, pepper) {
  return hmac(otp, pepper);
}

function keys(purpose, identifier) {
  const id = String(identifier).toLowerCase();
  return {
    code: `otp:${purpose}:${id}:code`,
    attempts: `otp:${purpose}:${id}:attempts`,
    cooldown: `otp:cooldown:${purpose}:${id}`,
    hourly: `otp:hourly:${purpose}:${id}`,
    verified: `otp:verified:${purpose}:${id}`
  };
}

async function requestOtp({
  redis,
  purpose,
  identifier,
  pepper,
  ttlSeconds = 300,
  cooldownSeconds = 60,
  hourlyLimit = 3
}) {
  const k = keys(purpose, identifier);
  const cooldown = await redis.get(k.cooldown);
  if (cooldown) {
    throw new ApiError(429, "Please wait before requesting another OTP", {
      retryAfter: await redis.ttl(k.cooldown)
    });
  }
  const hourly = await redis.incr(k.hourly);
  if (hourly === 1) await redis.expire(k.hourly, 3600);
  if (hourly > hourlyLimit) {
    throw new ApiError(429, "Too many OTP requests. Try again later.");
  }

  const otp = generateOtp();
  const multi = redis.multi();
  multi.set(k.code, hashOtp(otp, pepper), "EX", ttlSeconds);
  multi.set(k.attempts, "0", "EX", ttlSeconds + 600);
  multi.set(k.cooldown, "1", "EX", cooldownSeconds);
  await multi.exec();
  return { otp, expiresIn: ttlSeconds, resendAfter: cooldownSeconds };
}

async function verifyOtp({ redis, purpose, identifier, otp, pepper, maxAttempts = 5 }) {
  const k = keys(purpose, identifier);
  const stored = await redis.get(k.code);
  if (!stored) return { ok: false, reason: "missing" };

  const attempts = await redis.incr(k.attempts);
  if (attempts > maxAttempts) {
    await redis.del(k.code);
    return { ok: false, reason: "locked" };
  }

  if (!safeEqual(stored, hashOtp(otp, pepper))) {
    return { ok: false, reason: "invalid", attemptsLeft: Math.max(0, maxAttempts - attempts) };
  }

  await redis.del(k.code, k.attempts);
  return { ok: true };
}

async function issueVerificationToken({ redis, purpose, identifier, ttlSeconds = 600 }) {
  const k = keys(purpose, identifier);
  const token = crypto.randomBytes(32).toString("hex");
  await redis.set(k.verified, token, "EX", ttlSeconds);
  return token;
}

async function consumeVerificationToken({ redis, purpose, identifier, token }) {
  const k = keys(purpose, identifier);
  const stored = await redis.get(k.verified);
  if (!stored || !safeEqual(stored, token || "")) return false;
  await redis.del(k.verified);
  return true;
}

module.exports = {
  generateOtp,
  hashOtp,
  keys,
  requestOtp,
  verifyOtp,
  issueVerificationToken,
  consumeVerificationToken
};
