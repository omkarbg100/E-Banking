const express = require("express");
const router = express.Router();

const {
  adminLogin,
  notifyUserByAdmin,
} = require("../Controllers/adminController");

const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");

// Public
router.post("/login", adminLogin);

// Protected
router.post("/notify", auth, role("ADMIN"), notifyUserByAdmin);

module.exports = router;
