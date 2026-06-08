const express = require("express");
const router = express.Router();
const apiAuth = require("../Middleware/apiAuthMiddleware");
const { createOrder, verifyPayment, refundPayment, getOrderByOrderId } = require("../Controllers/paymentGatewayController");

// Server-to-server authenticated routes (Developer calls this with Secret Key)
router.post("/create-order", apiAuth, createOrder);
router.post("/refund", apiAuth, refundPayment);

// Client-side execution (Checkout Modal calls this, could use a public key check, but for simulation we just execute)
router.post("/verify", verifyPayment);
router.get("/order/:orderId", getOrderByOrderId);

module.exports = router;
