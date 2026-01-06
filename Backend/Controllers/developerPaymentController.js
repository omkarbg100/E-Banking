const Account = require("../Models/Account");
const DeveloperAccount = require("../Models/DeveloperAccount");
const Transaction = require("../Models/Transaction");
const QRCode = require("qrcode");

// ==========================
// API 1: CREATE DEVELOPER
// ==========================
exports.createDeveloper = async (req, res) => {
  try {
    const { developerName, accountNumber } = req.body;

    if (!developerName || !accountNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 1. Check account exists
    const account = await Account.findOne({ accountNumber });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // 2. Check ownership
    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your account" });
    }

    // 3. Check account status
    if (account.status !== "ACTIVE") {
      return res.status(400).json({ message: "Account is not active" });
    }

    // 4. One developer per account
    const existingDev = await DeveloperAccount.findOne({ accountNumber });
    if (existingDev) {
      return res
        .status(400)
        .json({ message: "Developer account already exists for this account" });
    }

    // 5. Generate IDs
    const merchantId = "MERCHANT_" + Date.now();
    const publicKey = "pk_" + Math.random().toString(36).substring(2, 12);

    // 6. Create developer
    const developer = await DeveloperAccount.create({
      userId: req.user.id,
      developerName,
      accountNumber,
      merchantId,
      publicKey,
    });

    // 7. Generate QR
    const qrPayload = JSON.stringify({ merchantId });
    const qrCode = await QRCode.toDataURL(qrPayload);

    res.status(201).json({
      success: true,
      message: "Developer account created",
      developer,
      qrCode,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const DeveloperAccount = require("../Models/DeveloperAccount");
// const Account = require("../Models/Account");

// ===============================
// PUBLIC: Get Merchant Info (QR)
// ===============================
exports.getDeveloperPublicInfo = async (req, res) => {
  try {
    const { merchantId } = req.params;

    if (!merchantId) {
      return res.status(400).json({ message: "Merchant ID is required" });
    }

    // 1. Find developer account
    const developer = await DeveloperAccount.findOne({ merchantId });
    if (!developer) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    // 2. Get linked bank account (optional but useful)
    const account = await Account.findOne({
      accountNumber: developer.accountNumber,
    });

    if (!account || account.status !== "ACTIVE") {
      return res
        .status(400)
        .json({ message: "Merchant account is not active" });
    }

    // 3. Send SAFE public data only
    res.json({
      success: true,
      merchant: {
        merchantId: developer.merchantId,
        developerName: developer.developerName,
        accountNumber: developer.accountNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// const DeveloperAccount = require("../Models/DeveloperAccount");
//const QRCode = require("qrcode");

// ===============================
// AUTH: Get My Developer Account
// ===============================
exports.getMyDeveloperAccount = async (req, res) => {
  try {
    // 1. Find developer account by user
    const developer = await DeveloperAccount.findOne({
      userId: req.user.id,
    });

    if (!developer) {
      return res
        .status(404)
        .json({ message: "Developer account not found" });
    }

    // 2. Regenerate QR (optional but useful)
    const qrPayload = JSON.stringify({
      merchantId: developer.merchantId,
    });
    const qrCode = await QRCode.toDataURL(qrPayload);

    // 3. Respond
    res.json({
      success: true,
      developer: {
        developerName: developer.developerName,
        merchantId: developer.merchantId,
        publicKey: developer.publicKey,
        accountNumber: developer.accountNumber,
        createdAt: developer.createdAt,
      },
      qrCode,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
