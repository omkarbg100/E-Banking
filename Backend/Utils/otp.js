const crypto = require("crypto");
const env = require("../Config/env");
const { getRedis, cacheKey } = require("../Infrastructure/redis");

function hashCode(email, otp) {
  return crypto
    .createHmac("sha256", env.OTP_PEPPER)
    .update(`${email.toLowerCase()}:${otp}`)
    .digest("hex");
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function storeOtp(kind, email, otp) {
  const key = cacheKey("otp", kind, email.toLowerCase());
  const value = JSON.stringify({ hash: hashCode(email, otp), attempts: 0 });
  await getRedis().set(key, value, "EX", env.OTP_TTL_SECONDS);
}

async function verifyOtp(kind, email, otp) {
  const key = cacheKey("otp", kind, email.toLowerCase());
  const redis = getRedis();
  const raw = await redis.get(key);
  if (!raw) return { ok: false, reason: "OTP_EXPIRED" };

  const record = JSON.parse(raw);
  if (record.attempts >= env.OTP_MAX_ATTEMPTS) {
    await redis.del(key);
    return { ok: false, reason: "TOO_MANY_ATTEMPTS" };
  }

  if (record.hash !== hashCode(email, otp)) {
    record.attempts += 1;
    await redis.set(key, JSON.stringify(record), "EX", env.OTP_TTL_SECONDS);
    return { ok: false, reason: "INVALID_OTP" };
  }

  await redis.del(key);
  return { ok: true };
}

async function issueVerificationToken(email) {
  const token = crypto.randomBytes(32).toString("hex");
  const key = cacheKey("otp", "verified", email.toLowerCase());
  await getRedis().set(key, token, "EX", env.OTP_TTL_SECONDS);
  return token;
}

async function consumeVerificationToken(email, token) {
  const key = cacheKey("otp", "verified", email.toLowerCase());
  const redis = getRedis();
  const stored = await redis.get(key);
  if (!stored || stored !== token) return false;
  await redis.del(key);
  return true;
}

async function consumeOtp(kind, email) {
  await getRedis().del(cacheKey("otp", kind, email.toLowerCase()));
}

module.exports = {
  generateOtp,
  storeOtp,
  verifyOtp,
  issueVerificationToken,
  consumeVerificationToken,
  consumeOtp
};
