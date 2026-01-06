const express = require("express");
const router = express.Router();

const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");

const {
  createDeveloper,
  getDeveloperPublicInfo,
  getMyDeveloperAccount,
} = require("../Controllers/developerPaymentController");

// Create developer account
router.post("/create", auth, role("USER"), createDeveloper);

// Get my developer account (dashboard)
router.get("/me", auth, role("USER"), getMyDeveloperAccount);

// Public merchant info (QR scan)
router.get("/:merchantId", getDeveloperPublicInfo);

module.exports = router;
