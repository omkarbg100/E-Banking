const express = require("express");
const router = express.Router();
const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");
const { registerWebhook, getWebhook } = require("../Controllers/webhookController");

// User authenticated routes for Developer Dashboard
router.post("/register", auth, role("USER"), registerWebhook);
router.get("/", auth, role("USER"), getWebhook);

module.exports = router;
