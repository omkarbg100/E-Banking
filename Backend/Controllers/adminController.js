const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const Payment = require("../Models/Payment");
const DeveloperAccount = require("../Models/DeveloperAccount");
const Webhook = require("../Models/Webhook");
const WebhookDelivery = require("../Models/WebhookDelivery");
const AdminAction = require("../Models/AdminAction");
const asyncHandler = require("../Middleware/asyncHandler");
const httpError = require("../Utils/httpError");
const env = require("../Config/env");
const notifyUser = require("../Utils/notifyUser");
const { getJSON, setJSON, cacheKey } = require("../Infrastructure/redis");
const { emitEvent } = require("../Infrastructure/events");
const { TOPICS } = require("../Infrastructure/kafka");

const adminLogin = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ email: req.body.email.toLowerCase(), role: "ADMIN" }).select("+password");
  if (!admin) throw httpError(401, "Invalid credentials");
  if (!admin.isActive) throw httpError(403, "Admin account is deactivated");

  const isMatch = await admin.comparePassword(req.body.password);
  if (!isMatch) throw httpError(401, "Invalid credentials");

  admin.lastLoginAt = new Date();
  await admin.save({ validateModifiedOnly: true });

  const token = jwt.sign({ id: admin._id.toString(), role: admin.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });

  res.json({ token, user: admin.toSafeJSON() });
});

const getStats = asyncHandler(async (req, res) => {
  const key = cacheKey("admin", "stats");
  const cached = await getJSON(key);
  if (cached) return res.json(cached);

  const [users, frozenAccounts, accountTotals, transactionTotals, payments, merchants, webhooks] =
    await Promise.all([
      User.countDocuments(),
      Account.countDocuments({ status: "FROZEN" }),
      Account.aggregate([{ $group: { _id: null, accounts: { $sum: 1 }, balance: { $sum: "$balance" } } }]),
      Transaction.aggregate([
        { $match: { status: "SUCCESS" } },
        { $group: { _id: null, count: { $sum: 1 }, volume: { $sum: "$amount" } } }
      ]),
      Payment.aggregate([
        { $match: { status: "SUCCESS" } },
        { $group: { _id: null, count: { $sum: 1 }, volume: { $sum: "$amount" } } }
      ]),
      DeveloperAccount.countDocuments(),
      Webhook.countDocuments({ isActive: true })
    ]);

  const payload = {
    users,
    accounts: accountTotals[0]?.accounts || 0,
    frozenAccounts,
    totalBalance: accountTotals[0]?.balance || 0,
    transactions: transactionTotals[0]?.count || 0,
    transactionVolume: transactionTotals[0]?.volume || 0,
    payments: payments[0]?.count || 0,
    paymentVolume: payments[0]?.volume || 0,
    merchants,
    activeWebhooks: webhooks
  };

  await setJSON(key, payload, 10);
  res.json(payload);
});

const listUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const [users, total] = await Promise.all([
    User.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments()
  ]);
  res.json({ users: users.map(({ password, ...user }) => ({ ...user, id: String(user._id) })), total, page, limit });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw httpError(404, "User not found");
  if (user.role === "ADMIN" && req.body.isActive === false) {
    throw httpError(400, "Admin accounts cannot be deactivated from this endpoint");
  }

  user.isActive = req.body.isActive;
  await user.save({ validateModifiedOnly: true });
  await AdminAction.create({
    adminId: req.user.id,
    actionType: req.body.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    details: `User ${user.email}`
  });
  await emitEvent(TOPICS.ADMIN_ACTION, {
    action: req.body.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    userId: user._id.toString(),
    adminId: req.user.id
  });

  res.json({ message: `User ${req.body.isActive ? "activated" : "deactivated"}`, user: user.toSafeJSON() });
});

const listTransactions = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const transactions = await Transaction.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  res.json(transactions);
});

const listPayments = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const [payments, total] = await Promise.all([
    Payment.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Payment.countDocuments()
  ]);
  res.json({ payments, total, page, limit });
});

const listMerchants = asyncHandler(async (req, res) => {
  const merchants = await DeveloperAccount.find()
    .select("developerName merchantId publicKey secretKeyPreview accountNumber isActive createdAt")
    .sort({ createdAt: -1 })
    .lean();
  res.json(merchants);
});

const listWebhooks = asyncHandler(async (req, res) => {
  const webhooks = await Webhook.find()
    .select("merchantId url isActive failureCount lastDeliveryAt createdAt")
    .sort({ createdAt: -1 })
    .lean();
  res.json(webhooks);
});

const listDeliveries = asyncHandler(async (req, res) => {
  const deliveries = await WebhookDelivery.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json(deliveries);
});

const notifyUserByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body.userId);
  if (!user) throw httpError(404, "User not found");

  await notifyUser({
    userId: user._id,
    title: req.body.title,
    message: req.body.message,
    type: req.body.type || "INFO"
  });
  await AdminAction.create({
    adminId: req.user.id,
    actionType: "USER_NOTIFIED",
    details: `${user.email}: ${req.body.title}`
  });

  res.json({ message: "Notification sent to user" });
});

module.exports = {
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
};
