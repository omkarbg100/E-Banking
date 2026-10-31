const crypto = require("crypto");
const QRCode = require("qrcode");
const Account = require("../Models/Account");
const DeveloperAccount = require("../Models/DeveloperAccount");
const asyncHandler = require("../Middleware/asyncHandler");
const httpError = require("../Utils/httpError");

function hashSecret(secret) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

const createDeveloper = asyncHandler(async (req, res) => {
  const { developerName, accountNumber } = req.body;

  const account = await Account.findOne({ accountNumber });
  if (!account) throw httpError(404, "Account not found");
  if (account.userId.toString() !== req.user.id) throw httpError(403, "Not your account");
  if (account.status !== "ACTIVE") throw httpError(400, "Account is not active");

  const existingDev = await DeveloperAccount.findOne({
    $or: [{ accountNumber }, { userId: req.user.id }]
  });
  if (existingDev) throw httpError(409, "Developer account already exists");

  const merchantId = `MERCHANT_${Date.now()}`;
  const publicKey = `pk_test_${crypto.randomBytes(8).toString("hex")}`;
  const secretKey = `sk_test_${crypto.randomBytes(24).toString("hex")}`;

  const developer = await DeveloperAccount.create({
    userId: req.user.id,
    developerName,
    accountNumber,
    merchantId,
    publicKey,
    secretKeyHash: hashSecret(secretKey),
    secretKeyPreview: `${secretKey.slice(0, 12)}...${secretKey.slice(-4)}`
  });

  const qrCode = await QRCode.toDataURL(JSON.stringify({ merchantId }));

  res.status(201).json({
    success: true,
    message: "Developer account created. Store the secret key now — it will not be shown again.",
    developer: {
      developerName: developer.developerName,
      merchantId: developer.merchantId,
      publicKey: developer.publicKey,
      secretKey,
      secretKeyPreview: developer.secretKeyPreview,
      accountNumber: developer.accountNumber,
      createdAt: developer.createdAt
    },
    qrCode
  });
});

const getDeveloperPublicInfo = asyncHandler(async (req, res) => {
  const developer = await DeveloperAccount.findOne({ merchantId: req.params.merchantId, isActive: true });
  if (!developer) throw httpError(404, "Merchant not found");

  const account = await Account.findOne({ accountNumber: developer.accountNumber });
  if (!account || account.status !== "ACTIVE") throw httpError(400, "Merchant account is not active");

  res.json({
    success: true,
    merchant: {
      merchantId: developer.merchantId,
      developerName: developer.developerName,
      accountNumber: developer.accountNumber
    }
  });
});

const getMyDeveloperAccount = asyncHandler(async (req, res) => {
  const developer = await DeveloperAccount.findOne({ userId: req.user.id });
  if (!developer) throw httpError(404, "Developer account not found");

  const qrCode = await QRCode.toDataURL(JSON.stringify({ merchantId: developer.merchantId }));

  res.json({
    success: true,
    developer: {
      developerName: developer.developerName,
      merchantId: developer.merchantId,
      publicKey: developer.publicKey,
      secretKeyPreview: developer.secretKeyPreview,
      accountNumber: developer.accountNumber,
      createdAt: developer.createdAt
    },
    qrCode
  });
});

const regenerateSecret = asyncHandler(async (req, res) => {
  const developer = await DeveloperAccount.findOne({ userId: req.user.id });
  if (!developer) throw httpError(404, "Developer account not found");

  const secretKey = `sk_test_${crypto.randomBytes(24).toString("hex")}`;
  developer.secretKeyHash = hashSecret(secretKey);
  developer.secretKeyPreview = `${secretKey.slice(0, 12)}...${secretKey.slice(-4)}`;
  developer.secretKey = undefined;
  await developer.save();

  res.json({
    success: true,
    message: "Secret key rotated. Update your integration now.",
    secretKey,
    secretKeyPreview: developer.secretKeyPreview
  });
});

module.exports = {
  createDeveloper,
  getDeveloperPublicInfo,
  getMyDeveloperAccount,
  regenerateSecret,
  hashSecret
};
