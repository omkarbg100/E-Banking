const express = require("express");
const router = express.Router();

const { getMyQRCode, payViaQR } = require("../Controllers/qrController");

const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");

// Get my QR
router.get("/me", auth, role("USER"), getMyQRCode);

// Pay via QR
router.post("/pay", auth, role("USER"), payViaQR);

module.exports = router;
