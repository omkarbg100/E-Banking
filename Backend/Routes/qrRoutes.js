const express = require("express");
const { z } = require("zod");
const router = express.Router();

const { getMyQRCode, payViaQR } = require("../Controllers/qrController");
const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");
const validate = require("../Middleware/validate");
const idempotency = require("../Middleware/idempotency");
const rateLimit = require("../Middleware/rateLimit");

router.get("/me", auth, role("USER"), getMyQRCode);

router.post(
  "/pay",
  auth,
  role("USER"),
  rateLimit({ prefix: "qr-pay", limit: 60, windowSeconds: 60, keyGenerator: (req) => req.user.id }),
  idempotency("qr-pay"),
  validate({
    body: z.object({
      fromAccount: z.string().trim().min(6).max(40),
      toAccount: z.string().trim().min(6).max(40),
      amount: z.coerce.number().positive().max(1000000),
      idempotencyKey: z.string().min(8).max(128).optional()
    })
  }),
  payViaQR
);

module.exports = router;
