const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const notifyUser = require("../Utils/notifyUser");
const crypto = require("crypto");
const User = require("../Models/User");

// helper to generate referenceId
const generateRefId = () =>
  "TXN-" + crypto.randomBytes(6).toString("hex").toUpperCase();

/* ===================== USER CREDIT ===================== */
exports.creditMoney = async (req, res) => {
  try {
    const { accountNumber, amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const account = await Account.findOne({
      accountNumber,
      userId: req.user.id,
      status: "ACTIVE",
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found or inactive" });
    }

    account.balance += amount;
    await account.save();

    await Transaction.create({
      referenceId: generateRefId(),
      fromAccount: null,
      toAccount: accountNumber,
      amount,
      type: "CREDIT",
      initiatedBy: "USER",
      balanceAfterTransaction: account.balance,
      description: "Money credited",
    });

    await notifyUser({
      userId: req.user.id,
      title: "Money Credited",
      message: `₹${amount} credited to your account`,
    });

    res.json({ message: "Money credited", balance: account.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== USER TRANSFER ===================== */
exports.transferMoney = async (req, res) => {
  try {
    const { fromAccount, toAccount, amount } = req.body;

    if (fromAccount === toAccount) {
      return res
        .status(400)
        .json({ message: "Same account transfer not allowed" });
    }

    const sender = await Account.findOne({
      accountNumber: fromAccount,
      userId: req.user.id,
      status: "ACTIVE",
    });

    const receiver = await Account.findOne({
      accountNumber: toAccount,
      status: "ACTIVE",
    });

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    await Transaction.create({
      referenceId: generateRefId(),
      fromAccount,
      toAccount,
      amount,
      type: "TRANSFER",
      initiatedBy: "USER",
      balanceAfterTransaction: sender.balance,
      description: "User transfer",
    });

    await notifyUser({
      userId: sender.userId,
      title: "Money Sent",
      message: `₹${amount} sent to ${toAccount}`,
    });

    await notifyUser({
      userId: receiver.userId,
      title: "Money Received",
      message: `₹${amount} received from ${fromAccount}`,
    });

    res.json({ message: "Transfer successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== USER TRANSACTION HISTORY ===================== */
exports.getMyTransactions = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id }).select(
      "accountNumber"
    );

    const accNumbers = accounts.map((a) => a.accountNumber);

    const transactions = await Transaction.find({
      $or: [
        { fromAccount: { $in: accNumbers } },
        { toAccount: { $in: accNumbers } },
      ],
    }).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===================== ADMIN ADJUST BALANCE ===================== */
exports.adminAdjustBalance = async (req, res) => {
  try {
    const { accountNumber, amount, action } = req.body;

    const account = await Account.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (action === "CREDIT") {
      account.balance += amount;
    } else if (action === "DEBIT") {
      if (account.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      account.balance -= amount;
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await account.save();

    await Transaction.create({
      referenceId: generateRefId(),
      fromAccount: action === "DEBIT" ? accountNumber : null,
      toAccount: action === "CREDIT" ? accountNumber : null,
      amount,
      type: "ADMIN_ADJUST",
      initiatedBy: "ADMIN",
      balanceAfterTransaction: account.balance,
      description: `Admin ${action.toLowerCase()}`,
    });

    await notifyUser({
      userId: account.userId,
      title: "Admin Adjustment",
      message: `₹${amount} ${action.toLowerCase()}ed by admin`,
      type: "ALERT",
    });

    res.json({ message: "Account adjusted", balance: account.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// controllers/transaction.controller.js

//const Transaction = require("../models/transaction.model");

exports.getTopRecentAccountsForUser = async (req, res) => {
  try {
    const user = req.user.id;
    const userAccounts = await Account.find({ userId: user }).select(
      "accountNumber -_id"
    );
    const accountNumbers = userAccounts.map((acc) => acc.accountNumber);
    if (accountNumbers.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        accounts: [],
      });
    }

    // 2️⃣ Find recent transactions for these accounts
    const recentAccounts = await Transaction.aggregate([
      {
        $match: {
          status: "SUCCESS",
          $or: [
            { fromAccount: { $in: accountNumbers } },
            { toAccount: { $in: accountNumbers } },
          ],
        },
      },
      {
        $addFields: {
          otherAccount: {
            $cond: [
              { $in: ["$fromAccount", accountNumbers] },
              "$toAccount",
              "$fromAccount",
            ],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$otherAccount",
          lastTransactionAt: { $first: "$createdAt" },
          lastAmount: { $first: "$amount" },
          lastTransactionId: { $first: "$_id" },
        },
      },
      { $sort: { lastTransactionAt: -1 } },
      { $limit: 10 },
      // 🔹 Lookup the user who owns this account
      {
        $lookup: {
          from: "accounts", // collection name for Account
          localField: "_id", // otherAccount number
          foreignField: "accountNumber",
          as: "accountInfo",
        },
      },
      {
        $unwind: {
          path: "$accountInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users", // collection name for User
          localField: "accountInfo.userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          accountNumber: "$_id",
          lastTransactionAt: 1,
          lastAmount: 1,
          lastTransactionId: 1,
          accountHolderName: "$userInfo.name",
        },
      },
    ]);

    console.log("Recent Accounts fetched:", recentAccounts.length);
    return res.status(200).json({
      success: true,
      count: recentAccounts.length,
      accounts: recentAccounts.map((acc) => ({
        accountHolderName: acc.accountHolderName || "Unknown",
        accountNumber: acc.accountNumber,
        lastTransaction: acc.lastTransactionAt,
        lastAmount: acc.lastAmount,
        transactionId: acc.lastTransactionId,
      })),
    });
  } catch (error) {
    console.error("Recent accounts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent accounts",
    });
  }
};

/**
 * Get transactions between two accounts (both directions)
 * Works across ALL users (but secured by auth)
 *
 * Query params:
 *  - fromAccount
 *  - toAccount
 */
exports.getTransactionsBetweenAccounts = async (req, res) => {
  try {
    const { fromAccount, toAccount } = req.query;

    if (!fromAccount || !toAccount) {
      return res.status(400).json({
        message: "fromAccount and toAccount are required",
      });
    }

    const transactions = await Transaction.find({
      $or: [
        { fromAccount, toAccount },
        { fromAccount: toAccount, toAccount: fromAccount },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50); // you can change or paginate later

    return res.json({
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Get transactions between accounts error:", error);
    return res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
};
