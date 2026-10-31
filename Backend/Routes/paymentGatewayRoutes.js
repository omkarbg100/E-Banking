const express = require("express");
const { z } = require("zod");
const router = express.Router();

const apiAuth = require("../Middleware/apiAuthMiddleware");
const auth = require("../Middleware/authMiddleware");
const validate = require("../Middleware/validate");
const idempotency = require("../Middleware/idempotency");
const rateLimit = require("../Middleware/rateLimit");

const {
  createOrder,
  verifyPayment,
  refundPayment,
  getOrderByOrderId
} = require("../Controllers/paymentGatewayController");

router.post(
  "/create-order",
  apiAuth,
  rateLimit({
    prefix: "merchant-create-order",
    limit: 120,
    windowSeconds: 60,
    keyGenerator: (req) => req.merchant?.merchantId
  }),
  validate({
    body: z.object({
      amount: z.coerce.number().positive().max(1000000),
      currency: z.string().length(3).optional(),
      redirectUrl: z.string().url().max(2000).optional()
    })
  }),
  createOrder
);

router.post(
  "/refund",
  apiAuth,
  validate({
    body: z.object({
      paymentId: z.string().optional(),
      orderId: z.string().optional()
    }).refine((data) => data.paymentId || data.orderId, { message: "paymentId or orderId is required" })
  }),
  refundPayment
);

router.post(
  "/verify",
  auth,
  idempotency("payment-verify"),
  validate({
    body: z.object({
      orderId: z.string().min(3).max(100),
      method: z.enum(["UPI", "ACCOUNT_BALANCE"]).optional(),
      fromAccount: z.string().trim().min(6).max(40)
    })
  }),
  verifyPayment
);

router.get("/order/:orderId", getOrderByOrderId);

module.exports = router;
