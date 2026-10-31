const express = require("express");
const { z } = require("zod");
const router = express.Router();
const auth = require("../Middleware/authMiddleware");
const validate = require("../Middleware/validate");
const rateLimit = require("../Middleware/rateLimit");

const {
  sendRegisterOtp,
  verifyRegisterOtp,
  register,
  login,
  forgotPassword,
  resetPassword,
  resetPasswordLoggedIn,
  getMe
} = require("../Controllers/userController");

const emailSchema = z.string().email().max(254);
const passwordSchema = z.string().min(8).max(128);
const otpSchema = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");

router.post(
  "/send-register-otp",
  rateLimit({
    prefix: "otp-send-ip",
    limit: 10,
    windowSeconds: 900,
    message: "Too many OTP requests. Try again later."
  }),
  rateLimit({
    prefix: "otp-send-email",
    limit: 5,
    windowSeconds: 900,
    keyGenerator: (req) => req.body?.email?.toLowerCase()
  }),
  validate({ body: z.object({ email: emailSchema }) }),
  sendRegisterOtp
);

router.post(
  "/verify-register-otp",
  rateLimit({
    prefix: "otp-verify",
    limit: 20,
    windowSeconds: 900,
    keyGenerator: (req) => `${req.ip}:${req.body?.email?.toLowerCase() || ""}`
  }),
  validate({ body: z.object({ email: emailSchema, otp: otpSchema }) }),
  verifyRegisterOtp
);

router.post(
  "/register",
  validate({
    body: z.object({
      name: z.string().trim().min(2).max(100),
      email: emailSchema,
      password: passwordSchema,
      verificationToken: z.string().min(32)
    })
  }),
  register
);

router.post(
  "/login",
  rateLimit({
    prefix: "login-ip",
    limit: 20,
    windowSeconds: 900,
    keyGenerator: (req) => req.ip
  }),
  rateLimit({
    prefix: "login-account",
    limit: 10,
    windowSeconds: 900,
    keyGenerator: (req) => req.body?.email?.toLowerCase()
  }),
  validate({ body: z.object({ email: emailSchema, password: z.string().min(1).max(128) }) }),
  login
);

router.post(
  "/forgot-password",
  rateLimit({
    prefix: "forgot-ip",
    limit: 10,
    windowSeconds: 900,
    keyGenerator: (req) => req.ip
  }),
  validate({ body: z.object({ email: emailSchema }) }),
  forgotPassword
);

router.post(
  "/reset-password",
  rateLimit({
    prefix: "reset-ip",
    limit: 20,
    windowSeconds: 900,
    keyGenerator: (req) => req.ip
  }),
  validate({
    body: z.object({
      email: emailSchema,
      otp: otpSchema,
      newPassword: passwordSchema
    })
  }),
  resetPassword
);

router.post(
  "/reset-password-otp",
  validate({
    body: z.object({
      email: emailSchema,
      otp: otpSchema,
      newPassword: passwordSchema
    })
  }),
  resetPassword
);

router.post(
  "/reset-password-logged-in",
  auth,
  validate({
    body: z.object({
      oldPassword: z.string().min(1).max(128),
      newPassword: passwordSchema
    })
  }),
  resetPasswordLoggedIn
);

router.get("/me", auth, getMe);

module.exports = router;
