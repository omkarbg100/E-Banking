const express = require("express");
const { z } = require("zod");
const router = express.Router();

const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");
const validate = require("../Middleware/validate");
const { registerWebhook, getWebhook, getDeliveries } = require("../Controllers/webhookController");

router.post(
  "/register",
  auth,
  role("USER"),
  validate({
    body: z.object({
      url: z.string().url().max(2000),
      secret: z.string().min(16).max(200)
    })
  }),
  registerWebhook
);

router.get("/", auth, role("USER"), getWebhook);
router.get("/deliveries", auth, role("USER"), getDeliveries);

module.exports = router;
