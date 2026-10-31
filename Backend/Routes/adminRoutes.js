const express = require("express");
const { z } = require("zod");
const router = express.Router();

const {
  adminLogin,
  getStats,
  listUsers,
  updateUserStatus,
  listTransactions,
  listPayments,
  listMerchants,
  listWebhooks,
  listDeliveries,
  notifyUserByAdmin
} = require("../Controllers/adminController");
const { getAllAccounts, updateAccountStatus } = require("../Controllers/accountController");

const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");
const validate = require("../Middleware/validate");
const rateLimit = require("../Middleware/rateLimit");

router.post(
  "/login",
  rateLimit({
    prefix: "admin-login",
    limit: 10,
    windowSeconds: 900,
    keyGenerator: (req) => `${req.ip}:${req.body?.email?.toLowerCase() || ""}`
  }),
  validate({
    body: z.object({
      email: z.string().email().max(254),
      password: z.string().min(1).max(128)
    })
  }),
  adminLogin
);

router.use(auth, role("ADMIN"));

router.get("/stats", getStats);
router.get("/accounts", getAllAccounts);
router.put(
  "/accounts/status",
  validate({
    body: z.object({
      accountNumber: z.string().min(6),
      status: z.enum(["ACTIVE", "FROZEN", "CLOSED"])
    })
  }),
  updateAccountStatus
);
router.get("/users", listUsers);
router.patch(
  "/users/:id/status",
  validate({ body: z.object({ isActive: z.boolean() }) }),
  updateUserStatus
);
router.get("/transactions", listTransactions);
router.get("/payments", listPayments);
router.get("/merchants", listMerchants);
router.get("/webhooks", listWebhooks);
router.get("/deliveries", listDeliveries);
router.post(
  "/notify",
  validate({
    body: z.object({
      userId: z.string().min(1),
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(1000),
      type: z.enum(["INFO", "WARNING", "ALERT"]).optional()
    })
  }),
  notifyUserByAdmin
);

module.exports = router;
