const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const env = require("../Config/env");
const asyncHandler = require("../Middleware/asyncHandler");
const httpError = require("../Utils/httpError");
const { enqueueEmail } = require("../Infrastructure/queue");
const { emitEvent } = require("../Infrastructure/events");
const { TOPICS } = require("../Infrastructure/kafka");
const { getRedis, cacheKey } = require("../Infrastructure/redis");
const {
  generateOtp,
  storeOtp,
  verifyOtp,
  issueVerificationToken,
  consumeVerificationToken
} = require("../Utils/otp");

function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

function otpEmail(kind, otp) {
  const action = kind === "reset" ? "reset your password" : "complete your registration";
  return {
    subject: `Your E-Banking OTP: ${otp}`,
    text: `Use OTP ${otp} to ${action}. It expires in ${Math.round(env.OTP_TTL_SECONDS / 60)} minutes.`,
    html: `<p>Use the OTP below to ${action}:</p><h2 style="letter-spacing:6px">${otp}</h2><p>This code expires in ${Math.round(env.OTP_TTL_SECONDS / 60)} minutes. Never share it with anyone.</p>`
  };
}

const sendRegisterOtp = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) throw httpError(409, "Email already registered");

  const otp = generateOtp();
  await storeOtp("register", email, otp);
  const mail = otpEmail("register", otp);
  await enqueueEmail({ to: email, ...mail });
  await emitEvent(TOPICS.OTP_REQUESTED, { email, purpose: "register" }, email);

  res.status(202).json({ message: "OTP sent to email" });
});

const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const result = await verifyOtp("register", email, req.body.otp);
  if (!result.ok) {
    throw httpError(400, result.reason === "TOO_MANY_ATTEMPTS" ? "Too many invalid attempts" : "Invalid or expired OTP");
  }

  const verificationToken = await issueVerificationToken(email);
  res.json({ message: "OTP verified successfully", verificationToken });
});

const register = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const verified = await consumeVerificationToken(email, req.body.verificationToken);
  if (!verified) throw httpError(400, "OTP verification required or expired");

  const existing = await User.findOne({ email });
  if (existing) throw httpError(409, "Email already registered");

  const user = await User.create({
    name: req.body.name,
    email,
    password: req.body.password
  });

  await emitEvent(
    TOPICS.USER_REGISTERED,
    { userId: user._id.toString(), name: user.name, email: user.email },
    user._id.toString()
  );

  res.status(201).json({ message: "User registered successfully", user: user.toSafeJSON() });
});

const login = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw httpError(401, "Invalid credentials");
  if (!user.isActive) throw httpError(403, "Account is deactivated");

  const isMatch = await user.comparePassword(req.body.password);
  if (!isMatch) throw httpError(401, "Invalid credentials");

  user.lastLoginAt = new Date();
  await user.save({ validateModifiedOnly: true });

  res.json({ token: signToken(user), user: user.toSafeJSON() });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await User.findOne({ email });

  if (user) {
    const otp = generateOtp();
    await storeOtp("reset", email, otp);
    const mail = otpEmail("reset", otp);
    await enqueueEmail({ to: email, ...mail });
    await emitEvent(TOPICS.OTP_REQUESTED, { email, purpose: "reset" }, email);
  }

  res.json({ message: "If the account exists, a reset OTP has been sent" });
});

const resetPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const result = await verifyOtp("reset", email, req.body.otp);
  if (!result.ok) throw httpError(400, "Invalid or expired OTP");

  const user = await User.findOne({ email });
  if (!user) throw httpError(400, "Invalid or expired OTP");

  user.password = req.body.newPassword;
  await user.save();
  await getRedis().del(cacheKey("user", "sessions", user._id.toString()));

  res.json({ message: "Password reset successful" });
});

const resetPasswordLoggedIn = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!user) throw httpError(404, "User not found");

  const isMatch = await user.comparePassword(req.body.oldPassword);
  if (!isMatch) throw httpError(401, "Old password is incorrect");

  user.password = req.body.newPassword;
  await user.save();

  res.json({ message: "Password updated successfully" });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw httpError(404, "User not found");
  res.json({ user: user.toSafeJSON() });
});

module.exports = {
  sendRegisterOtp,
  verifyRegisterOtp,
  register,
  login,
  forgotPassword,
  resetPassword,
  resetPasswordLoggedIn,
  getMe
};
