const express = require("express");
const router = express.Router();

const {
  getMyAccount,
  getAllAccounts,
  getMyAccountList,
  createAccount,
  updateAccountStatus,
  UpdateAccountInfo,
  deleteAccount,
} = require("../Controllers/accountController");

const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");


// Create new account
router.post("/create", auth, role("USER"), createAccount);
router.get("/me", auth, role("USER"), getMyAccountList);
router.get("/me/:accountNumber", auth, role("USER"), getMyAccount);

// ADMIN ROUTES
router.get("/", auth, role("ADMIN"), getAllAccounts);
router.put("/status", auth, role("ADMIN"), updateAccountStatus);
router.put("/:accountNumber", auth, role("ADMIN"), UpdateAccountInfo);
router.delete("/:accountNumber", auth, role("ADMIN"), deleteAccount);


module.exports = router;
