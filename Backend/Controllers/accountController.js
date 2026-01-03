const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const User = require("../Models/User");

// ================= USER CONTROLLERS =================

const crypto = require("crypto");

// helper function
const generateAccountNumber = async () => {
  let accountNumber;
  let exists = true;

  while (exists) {
    accountNumber =
      "EB" +
      new Date().getFullYear() +
      crypto.randomInt(100000, 999999);

    exists = await Account.exists({ accountNumber });
  }

  return accountNumber;
};

// ================= CREATE ACCOUNT (USER) =================
const createAccount = async (req, res) => {
  try {
    const { accountType } = req.body;

    if (!accountType) {
      return res.status(400).json({ message: "Account type is required" });
    }

    // Optional: limit accounts per user
    const existingAccounts = await Account.countDocuments({
      userId: req.user.id,
    });

    if (existingAccounts >= 3) {
      return res
        .status(400)
        .json({ message: "Maximum 3 accounts allowed per user" });
    }

    const accountNumber = await generateAccountNumber();

    const account = await Account.create({
      userId: req.user.id,
      accountNumber,
      accountType,
      balance: 0,
      status: "ACTIVE",
    });

    res.status(201).json({
      message: "Account created successfully",
      account,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all accounts of the logged-in user (list)
const getMyAccountList = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id });
    if (!accounts || accounts.length === 0) {
      return res
        .status(404)
        .json({ message: "No accounts found for this user" });
    }
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single account by accountNumber (logged-in user)
const getMyAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    const account = await Account.findOne({
      accountNumber,
      userId: req.user.id,
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= ADMIN CONTROLLERS =================

// Get all accounts (admin)
const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find().populate("userId", "name email");
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Freeze/Unfreeze account (admin)
const updateAccountStatus = async (req, res) => {
  try {
    const { accountNumber, status } = req.body;

    if (!["ACTIVE", "FROZEN"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const account = await Account.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    account.status = status;
    await account.save();

    res.json({ message: `Account status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update account info (admin)
const UpdateAccountInfo = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const updateFields = req.body;

    const account = await Account.findOneAndUpdate(
      { accountNumber },
      updateFields,
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json({ message: "Account updated", account });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete account (simulation, admin)
const deleteAccount = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    const account = await Account.findOneAndDelete({ accountNumber });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json({ message: "Account deleted (simulation)" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyAccountList,
  getMyAccount,
    createAccount,
  getAllAccounts,
  updateAccountStatus,
  UpdateAccountInfo,
  deleteAccount,
};
