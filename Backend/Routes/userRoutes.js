const express = require("express");
const router = express.Router();
const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");


const {
  sendRegisterOtp,
  verifyRegisterOtp,
  register,
  login,
  forgotPassword,
  resetPassword,
  resetPasswordLoggedIn,
} = require("../Controllers/userController");


// ================= REGISTRATION (OTP FIRST) =================
// Step 1: Send OTP to email
router.post("/send-register-otp", sendRegisterOtp);

// Step 2: Verify OTP
router.post("/verify-register-otp", verifyRegisterOtp);

// Step 3: Final registration (after OTP verified)
router.post("/register", register);

// Public routes
router.post("/login", login);
router.post("/forgot-password", forgotPassword);        // OTP flow
router.post("/reset-password-otp", resetPassword);   // OTP flow

// Protected route (logged in user)
router.post("/reset-password", auth, role("USER"), resetPasswordLoggedIn);

module.exports = router;




