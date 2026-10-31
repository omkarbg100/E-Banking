const express = require("express");
const { z } = require("zod");
const router = express.Router();

const {
  getMyAccount,
  getAllAccounts,
  getMyAccountList,
  createAccount,
  updateAccountStatus,
  UpdateAccountInfo,
  deleteAccount
} = require("../Controllers/accountController");

const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");
const validate = require("../Middleware/validate");

const accountNumber = z.string().trim().min(6).max(40);

router.post(
  "/create",
  auth,
  role("USER"),
  validate({ body: z.object({ accountType: z.enum(["SAVINGS", "CURRENT"]).optional() }) }),
  createAccount
);
router.get("/me/accountLists", auth, role("USER"), getMyAccountList);
router.get("/me/:accountNumber", auth, role("USER"), validate({ params: z.object({ accountNumber }) }), getMyAccount);

router.get("/", auth, role("ADMIN"), getAllAccounts);
router.put(
  "/status",
  auth,
  role("ADMIN"),
  validate({
    body: z.object({
      accountNumber,
      status: z.enum(["ACTIVE", "FROZEN", "CLOSED"])
    })
  }),
  updateAccountStatus
);
router.put(
  "/:accountNumber",
  auth,
  role("ADMIN"),
  validate({
    params: z.object({ accountNumber }),
    body: z.object({
      accountType: z.enum(["SAVINGS", "CURRENT"]).optional(),
      status: z.enum(["ACTIVE", "FROZEN", "CLOSED"]).optional()
    })
  }),
  UpdateAccountInfo
);
router.delete(
  "/:accountNumber",
  auth,
  role("ADMIN"),
  validate({ params: z.object({ accountNumber }) }),
  deleteAccount
);

module.exports = router;
