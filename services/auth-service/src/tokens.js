const { randomUUID } = require("crypto");
const { RefreshToken } = require("./models");
const {
  signAccessToken,
  sha256,
  randomToken,
  ApiError
} = require("@ebank/common");
const state = require("./state");

const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 7);

function refreshExpiry() {
  return new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
}

function accessPayload(user) {
  return {
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
    type: "access",
    jti: randomUUID()
  };
}

async function createRefreshRecord(userId, req) {
  const raw = randomToken(48);
  const jti = randomUUID();
  const expiresAt = refreshExpiry();
  await RefreshToken.create({
    userId,
    tokenHash: sha256(raw),
    jti,
    expiresAt,
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });
  return { raw, jti, expiresAt };
}

async function issueTokens(user, req) {
  const accessToken = signAccessToken(accessPayload(user), state.privateKey);
  const refresh = await createRefreshRecord(user._id, req);
  return {
    accessToken,
    refreshToken: refresh.raw,
    refreshExpiresAt: refresh.expiresAt
  };
}

async function rotateRefresh(rawToken, req) {
  if (!rawToken) throw new ApiError(401, "Refresh token missing");
  const record = await RefreshToken.findOne({ tokenHash: sha256(rawToken) });
  if (!record || record.revokedAt || record.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
  const { User } = require("./models");
  const user = await User.findById(record.userId);
  if (!user || !user.isActive) throw new ApiError(401, "User unavailable");

  const next = await createRefreshRecord(user._id, req);
  record.revokedAt = new Date();
  record.replacedBy = next.jti;
  await record.save();

  const accessToken = signAccessToken(accessPayload(user), state.privateKey);
  return {
    accessToken,
    refreshToken: next.raw,
    refreshExpiresAt: next.expiresAt,
    user
  };
}

async function revokeRefresh(rawToken) {
  if (!rawToken) return;
  await RefreshToken.updateOne(
    { tokenHash: sha256(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

async function revokeAllForUser(userId) {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
    path: "/"
  };
}

module.exports = {
  issueTokens,
  rotateRefresh,
  revokeRefresh,
  revokeAllForUser,
  cookieOptions,
  REFRESH_DAYS
};
