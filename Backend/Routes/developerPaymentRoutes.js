const express = require("express");
const { z } = require("zod");
const router = express.Router();

const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");
const validate = require("../Middleware/validate");

const {
  createDeveloper,
  getDeveloperPublicInfo,
  getMyDeveloperAccount,
  regenerateSecret
} = require("../Controllers/developerPaymentController");

router.post(
  "/create",
  auth,
  role("USER"),
  validate({
    body: z.object({
      developerName: z.string().trim().min(2).max(120),
      accountNumber: z.string().trim().min(6).max(40)
    })
  }),
  createDeveloper
);

router.get("/me", auth, role("USER"), getMyDeveloperAccount);
router.post("/regenerate-secret", auth, role("USER"), regenerateSecret);
router.get("/:merchantId", validate({ params: z.object({ merchantId: z.string().min(3) }) }), getDeveloperPublicInfo);

module.exports = router;
