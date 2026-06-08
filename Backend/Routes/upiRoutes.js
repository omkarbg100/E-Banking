const express = require("express");
const router = express.Router();
const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");
const { createUpiId, scanAndPay, createCollectRequest, getPendingRequests, approveCollectRequest } = require("../Controllers/upiController");

router.post("/create-id", auth, role("USER"), createUpiId);
router.post("/scan-pay", auth, role("USER"), scanAndPay);
router.post("/collect-request", auth, role("USER"), createCollectRequest);
router.get("/pending-requests", auth, role("USER"), getPendingRequests);
router.post("/collect-approve", auth, role("USER"), approveCollectRequest);

module.exports = router;
