const express = require("express");
const { z } = require("zod");
const router = express.Router();

const {
  creditMoney,
  transferMoney,
  getMyTransactions,
  adminAdjustBalance,
  getTopRecentAccountsForUser,
  getTransactionsBetweenAccounts
} = require("../Controllers/transactionController");

const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");
const validate = require("../Middleware/validate");
const rateLimit = require("../Middleware/rateLimit");
const idempotency = require("../Middleware/idempotency");

const accountNumber = z.string().trim().min(6).max(40);
const amount = z.coerce.number().positive().max(1000000);

const moneyLimiter = rateLimit({
  prefix: "money-mutation",
  limit: 60,
  windowSeconds: 60,
  keyGenerator: (req) => req.user?.id
});

router.post(
  "/credit",
  auth,
  role("USER"),
  moneyLimiter,
  idempotency("credit"),
  validate({
    body: z.object({
      accountNumber,
      amount,
      idempotencyKey: z.string().min(8).max(128).optional()
    })
  }),
  creditMoney
);

router.post(
  "/transfer",
  auth,
  role("USER"),
  moneyLimiter,
  idempotency("transfer"),
  validate({
    body: z
      .object({
        fromAccount: accountNumber.optional(),
        toAccount: accountNumber.optional(),
        fromAccountNumber: accountNumber.optional(),
        toAccountNumber: accountNumber.optional(),
        amount,
        description: z.string().max(300).optional(),
        idempotencyKey: z.string().min(8).max(128).optional()
      })
      .refine((data) => (data.fromAccount || data.fromAccountNumber) && (data.toAccount || data.toAccountNumber), {
        message: "Sender and receiver accounts are required"
      })
  }),
  transferMoney
);

router.get("/me", auth, role("USER"), getMyTransactions);
router.get("/recent-accounts", auth, role("USER"), getTopRecentAccountsForUser);
router.get(
  "/between",
  auth,
  role("USER"),
  validate({ query: z.object({ toAccount: accountNumber }) }),
  getTransactionsBetweenAccounts
);

router.post(
  "/admin-adjust",
  auth,
  role("ADMIN"),
  idempotency("admin-adjust"),
  validate({
    body: z.object({
      accountNumber,
      amount,
      action: z.enum(["CREDIT", "DEBIT"]),
      idempotencyKey: z.string().min(8).max(128).optional()
    })
  }),
  adminAdjustBalance
);

module.exports = router;
