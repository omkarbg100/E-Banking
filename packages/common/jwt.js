const jwt = require("jsonwebtoken");
const { ApiError } = require("./errors");
const { safeEqual } = require("./crypto");

let publicKey = process.env.JWT_PUBLIC_KEY || null;

async function initJwt(redis, explicitPublicKey) {
  if (explicitPublicKey) {
    publicKey = explicitPublicKey;
    return publicKey;
  }
  if (publicKey) return publicKey;
  for (let i = 0; i < 90; i += 1) {
    publicKey = await redis.get("auth:jwt_public_key");
    if (publicKey) return publicKey;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("JWT public key not available from auth-service");
}

function signAccessToken(payload, privateKey) {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "15m",
    issuer: "ebank-auth",
    audience: "ebank"
  });
}

function verifyAccessToken(token) {
  if (!publicKey) throw new Error("JWT public key not initialized");
  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    issuer: "ebank-auth",
    audience: "ebank"
  });
}

function extractToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) return next(new ApiError(401, "Authorization token missing"));
  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type !== "access") throw new Error("wrong token type");
    req.user = { id: decoded.sub, role: decoded.role, email: decoded.email, jti: decoded.jti };
    next();
  } catch (err) {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, role: decoded.role, email: decoded.email, jti: decoded.jti };
  } catch (err) {
    req.user = null;
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Unauthorized"));
    if (req.user.role !== role) return next(new ApiError(403, "Access denied"));
    next();
  };
}

function serviceAuth(req, res, next) {
  const token = req.headers["x-service-token"] || "";
  const expected = process.env.INTERNAL_SERVICE_TOKEN || "dev-internal-token";
  if (!safeEqual(token, expected)) return next(new ApiError(401, "Invalid service token"));
  next();
}

module.exports = {
  initJwt,
  signAccessToken,
  verifyAccessToken,
  authenticate,
  optionalAuth,
  requireRole,
  serviceAuth
};
