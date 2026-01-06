const express = require("express");
const router = express.Router();

const {
  creditMoney,
  transferMoney,
  getMyTransactions,
  adminAdjustBalance,
  getTopRecentAccountsForUser,
  getTransactionsBetweenAccounts,
} = require("../controllers/transactionController");

const auth = require("../Middleware/authMiddleware");
const role = require("../Middleware/roleMiddleware");

// USER ROUTES
router.post("/credit", auth, role("USER"), creditMoney);       // add money
router.post("/transfer", auth, role("USER"), transferMoney);  // send / QR
router.get("/me", auth, role("USER"), getMyTransactions);      // 
router.get("/recent-accounts", auth, role("USER"), getTopRecentAccountsForUser);
router.get( "/between",  auth, role("USER"), getTransactionsBetweenAccounts);


// ADMIN ROUTES
router.post("/admin-adjust", auth, role("ADMIN"), adminAdjustBalance);


module.exports = router;
