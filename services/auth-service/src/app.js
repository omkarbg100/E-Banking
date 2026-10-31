const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const pinoHttp = require("pino-http");
const { z } = require("zod");
const state = require("./state");
const { User, RefreshToken, AuditLog } = require("./models");
const {
  ApiError,
  asyncHandler,
  requestId,
  validate,
  authenticate,
  requireRole,
  serviceAuth,
  metricsMiddleware,
  metricsRouter,
  healthRouter,
  errorHandler,
  notFound,
  enforceRateLimit,
  requestOtp,
  verifyOtp,
  issueVerificationToken,
  consumeVerificationToken,
  TOPICS
} = require("@ebank/common");
const { issueTokens, rotateRefresh, revokeRefresh, revokeAllForUser, cookieOptions } = require("./tokens");
const { sendNotification, publishDomain } = require("./notify");

const emailSchema = z.object({ email: z.string().email() });
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  verificationToken: z.string().min(16)
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/)
});
const resetSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(128)
});
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
});

function audit(req, action, target, result = "SUCCESS", metadata) {
  AuditLog.create({
    actorId: req.user ? req.user.id : undefined,
    action,
    target,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    result,
    metadata
  }).catch(() => {});
}

function otpEmailText(purpose, otp) {
  const label =
    purpose === "REGISTER"
      ? "registration"
      : purpose === "RESET_PASSWORD"
        ? "password reset"
        : "verification";
  return `Your E-Banking ${label} OTP is ${otp}. It expires in 5 minutes. If you did not request this, ignore this email.`;
}

async function sendOtp(req, email, purpose) {
  await enforceRateLimit({
    redis: state.redis,
    key: `rl:otp:ip:${req.ip}`,
    limit: 30,
    windowSeconds: 900
  });
  const { otp, expiresIn, resendAfter } = await requestOtp({
    redis: state.redis,
    purpose,
    identifier: email,
    pepper: state.config.OTP_PEPPER
  });
  await sendNotification({
    channel: "email",
    to: email,
    subject: `E-Banking ${purpose === "REGISTER" ? "registration" : "password reset"} OTP`,
    text: otpEmailText(purpose, otp),
    template: "otp",
    data: { purpose, expiresIn }
  });
  return { expiresIn, resendAfter };
}

function createApp() {
  const app = express();
  const logger = state.logger;
  const origins =
    state.config.CORS_ORIGINS === "*"
      ? true
      : state.config.CORS_ORIGINS.split(",").map((s) => s.trim());

  app.set("trust proxy", 1);
  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => req.id }));
  app.use(helmet());
  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser(state.config.COOKIE_SECRET));
  app.use(metricsMiddleware("auth-service"));
  app.use(metricsRouter("auth-service"));
  app.use(
    healthRouter("auth-service", {
      mongo: async () => {
        if (require("mongoose").connection.readyState !== 1) throw new Error("mongo not connected");
      },
      redis: async () => {
        await state.redis.ping();
      }
    })
  );

  app.post(
    "/api/user/send-register-otp",
    validate({ body: emailSchema }),
    asyncHandler(async (req, res) => {
      const email = req.body.email.toLowerCase();
      const existing = await User.findOne({ email });
      if (existing) throw new ApiError(400, "Email already registered");
      const result = await sendOtp(req, email, "REGISTER");
      res.json({ message: "OTP sent to email", ...result });
    })
  );

  app.post(
    "/api/user/verify-register-otp",
    validate({ body: verifySchema }),
    asyncHandler(async (req, res) => {
      const email = req.body.email.toLowerCase();
      const result = await verifyOtp({
        redis: state.redis,
        purpose: "REGISTER",
        identifier: email,
        otp: req.body.otp,
        pepper: state.config.OTP_PEPPER
      });
      if (!result.ok) {
        if (result.reason === "locked") throw new ApiError(429, "Too many invalid attempts. Request a new OTP.");
        throw new ApiError(400, "Invalid or expired OTP");
      }
      const verificationToken = await issueVerificationToken({
        redis: state.redis,
        purpose: "REGISTER",
        identifier: email
      });
      audit(req, "OTP_VERIFIED", email);
      res.json({ message: "OTP verified successfully", verificationToken });
    })
  );

  app.post(
    "/api/user/register",
    validate({ body: registerSchema }),
    asyncHandler(async (req, res) => {
      const email = req.body.email.toLowerCase();
      const existing = await User.findOne({ email });
      if (existing) throw new ApiError(400, "Email already registered");
      const valid = await consumeVerificationToken({
        redis: state.redis,
        purpose: "REGISTER",
        identifier: email,
        token: req.body.verificationToken
      });
      if (!valid) throw new ApiError(400, "OTP verification required");

      const user = await User.create({
        name: req.body.name,
        email,
        password: req.body.password,
        emailVerifiedAt: new Date()
      });
      audit(req, "USER_REGISTERED", email);
      publishDomain(TOPICS.USER_REGISTERED, user._id.toString(), "user.registered", {
        userId: user._id.toString(),
        name: user.name,
        email: user.email
      });
      sendNotification({
        channel: "email",
        to: user.email,
        userId: user._id.toString(),
        subject: "Welcome to E-Banking",
        text: `Hi ${user.name}, your E-Banking account is ready. You can now create a bank account and start transacting.`,
        template: "welcome"
      }).catch(() => {});
      res.status(201).json({ message: "User registered successfully", user: user.toSafeJSON() });
    })
  );

  app.post(
    "/api/user/login",
    validate({ body: loginSchema }),
    asyncHandler(async (req, res) => {
      const email = req.body.email.toLowerCase();
      await enforceRateLimit({
        redis: state.redis,
        key: `rl:login:ip:${req.ip}`,
        limit: 40,
        windowSeconds: 900
      });
      const user = await User.findOne({ email });
      if (!user) throw new ApiError(401, "Invalid credentials");
      if (!user.isActive) throw new ApiError(403, "Account is disabled");
      const match = await user.comparePassword(req.body.password);
      if (!match) {
        audit(req, "LOGIN_FAILED", email, "FAILURE");
        throw new ApiError(401, "Invalid credentials");
      }
      user.lastLoginAt = new Date();
      await user.save();
      const tokens = await issueTokens(user, req);
      res.cookie("refresh_token", tokens.refreshToken, cookieOptions());
      audit(req, "LOGIN_SUCCEEDED", email);
      publishDomain(TOPICS.AUTH_LOGIN_SUCCEEDED, user._id.toString(), "auth.login.succeeded", {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });
      res.json({
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: user.toSafeJSON()
      });
    })
  );

  app.post(
    "/api/user/refresh",
    asyncHandler(async (req, res) => {
      const raw = req.cookies.refresh_token || req.body.refreshToken;
      const result = await rotateRefresh(raw, req);
      res.cookie("refresh_token", result.refreshToken, cookieOptions());
      res.json({ token: result.accessToken, user: result.user.toSafeJSON() });
    })
  );

  app.post(
    "/api/user/logout",
    asyncHandler(async (req, res) => {
      const raw = req.cookies.refresh_token || req.body.refreshToken;
      await revokeRefresh(raw);
      res.clearCookie("refresh_token", { path: "/" });
      res.json({ message: "Logged out" });
    })
  );

  app.post(
    "/api/user/forgot-password",
    validate({ body: emailSchema }),
    asyncHandler(async (req, res) => {
      const email = req.body.email.toLowerCase();
      const user = await User.findOne({ email });
      if (user) {
        try {
          await sendOtp(req, email, "RESET_PASSWORD");
        } catch (err) {
          if (err.status === 429) throw err;
        }
      }
      res.json({ message: "If the account exists, an OTP has been sent" });
    })
  );

  app.post(
    "/api/user/reset-password",
    validate({ body: resetSchema }),
    asyncHandler(async (req, res) => {
      const email = req.body.email.toLowerCase();
      const result = await verifyOtp({
        redis: state.redis,
        purpose: "RESET_PASSWORD",
        identifier: email,
        otp: req.body.otp,
        pepper: state.config.OTP_PEPPER
      });
      if (!result.ok) {
        if (result.reason === "locked") throw new ApiError(429, "Too many invalid attempts");
        throw new ApiError(400, "Invalid or expired OTP");
      }
      const user = await User.findOne({ email });
      if (!user) throw new ApiError(400, "Invalid or expired OTP");
      user.password = req.body.newPassword;
      await user.save();
      await revokeAllForUser(user._id);
      audit(req, "PASSWORD_RESET", email);
      publishDomain(TOPICS.USER_PASSWORD_RESET, user._id.toString(), "user.password.reset", {
        userId: user._id.toString(),
        email: user.email
      });
      res.json({ message: "Password reset successful" });
    })
  );

  app.post(
    "/api/user/reset-password-logged-in",
    authenticate,
    validate({ body: changePasswordSchema }),
    asyncHandler(async (req, res) => {
      const user = await User.findById(req.user.id);
      if (!user) throw new ApiError(404, "User not found");
      const match = await user.comparePassword(req.body.oldPassword);
      if (!match) throw new ApiError(401, "Old password is incorrect");
      user.password = req.body.newPassword;
      await user.save();
      await revokeAllForUser(user._id);
      audit(req, "PASSWORD_CHANGED", user.email);
      res.json({ message: "Password updated successfully" });
    })
  );

  app.post(
    "/api/admin/login",
    validate({ body: loginSchema }),
    asyncHandler(async (req, res) => {
      const email = req.body.email.toLowerCase();
      const admin = await User.findOne({ email, role: "ADMIN" });
      if (!admin) throw new ApiError(401, "Invalid credentials");
      const match = await admin.comparePassword(req.body.password);
      if (!match) throw new ApiError(401, "Invalid credentials");
      const tokens = await issueTokens(admin, req);
      res.cookie("refresh_token", tokens.refreshToken, cookieOptions());
      audit(req, "ADMIN_LOGIN", email);
      res.json({ token: tokens.accessToken, user: admin.toSafeJSON() });
    })
  );

  app.get(
    "/api/user/me",
    authenticate,
    asyncHandler(async (req, res) => {
      const user = await User.findById(req.user.id);
      if (!user) throw new ApiError(404, "User not found");
      res.json({ user: user.toSafeJSON() });
    })
  );

  app.get("/.well-known/jwks.json", (req, res) => {
    res.json({ keys: [{ kid: "ebank-auth-v1", alg: "RS256", use: "sig", publicKey: state.publicKey }] });
  });

  app.get("/internal/public-key", serviceAuth, (req, res) => {
    res.json({ publicKey: state.publicKey });
  });

  app.get(
    "/internal/users/:id",
    serviceAuth,
    asyncHandler(async (req, res) => {
      const user = await User.findById(req.params.id);
      if (!user) throw new ApiError(404, "User not found");
      res.json({ user: user.toSafeJSON() });
    })
  );

  app.get(
    "/internal/users",
    serviceAuth,
    asyncHandler(async (req, res) => {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Number(req.query.limit || 50));
      const filter = req.query.role ? { role: req.query.role } : {};
      const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        User.countDocuments(filter)
      ]);
      res.json({ users: users.map((u) => u.toSafeJSON()), total, page, limit });
    })
  );

  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
}

module.exports = { createApp };
