const express = require("express");
const { z } = require("zod");
const router = express.Router();
const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");
const validate = require("../Middleware/validate");
const idempotency = require("../Middleware/idempotency");
const rateLimit = require("../Middleware/rateLimit");

const {
  createUpiId,
  scanAndPay,
  createCollectRequest,
  getPendingRequests,
  approveCollectRequest,
  resolveUpi
} = require("../Controllers/upiController");

const upiId = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{2,40}@ebank$/, "Invalid UPI ID");
const accountNumber = z.string().trim().min(6).max(40);
const amount = z.coerce.number().positive().max(100000);

router.post(
  "/create-id",
  auth,
  role("USER"),
  validate({
    body: z.object({
      username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{2,40}$/),
      accountNumber
    })
  }),
  createUpiId
);

router.post(
  "/scan-pay",
  auth,
  role("USER"),
  rateLimit({ prefix: "upi-pay", limit: 60, windowSeconds: 60, keyGenerator: (req) => req.user.id }),
  idempotency("upi-pay"),
  validate({
    body: z.object({
      toUpiId: upiId,
      amount,
      fromAccount: accountNumber,
      idempotencyKey: z.string().min(8).max(128).optional()
    })
  }),
  scanAndPay
);

router.post(
  "/collect-request",
  auth,
  role("USER"),
  rateLimit({ prefix: "upi-collect", limit: 30, windowSeconds: 60, keyGenerator: (req) => req.user.id }),
  validate({
    body: z.object({
      payerUpiId: upiId,
      amount,
      description: z.string().max(300).optional()
    })
  }),
  createCollectRequest
);

router.get("/pending-requests", auth, role("USER"), getPendingRequests);

router.post(
  "/collect-approve",
  auth,
  role("USER"),
  idempotency("upi-collect-approve"),
  validate({
    body: z.object({
      requestId: z.string().min(4),
      fromAccount: accountNumber.optional(),
      idempotencyKey: z.string().min(8).max(128).optional()
    })
  }),
  approveCollectRequest
);

router.get("/resolve/:upiId", validate({ params: z.object({ upiId }) }), resolveUpi);

module.exports = router;
