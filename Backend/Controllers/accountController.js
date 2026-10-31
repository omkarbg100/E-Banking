const crypto = require("crypto");
const Account = require("../Models/Account");
const asyncHandler = require("../Middleware/asyncHandler");
const httpError = require("../Utils/httpError");
const { getJSON, setJSON, cacheKey, invalidate } = require("../Infrastructure/redis");
const { emitEvent } = require("../Infrastructure/events");
const { TOPICS } = require("../Infrastructure/kafka");

const LIST_TTL_SECONDS = 30;
const MAX_ACCOUNTS_PER_USER = 3;

function accountListCacheKey(userId) {
  return cacheKey("accounts", "list", userId);
}

async function generateAccountNumber() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const accountNumber = `EB${new Date().getFullYear()}${crypto.randomInt(100000, 999999)}`;
    const exists = await Account.exists({ accountNumber });
    if (!exists) return accountNumber;
  }
  throw httpError(500, "Could not allocate an account number");
}

const createAccount = asyncHandler(async (req, res) => {
  const existingAccounts = await Account.countDocuments({ userId: req.user.id });
  if (existingAccounts >= MAX_ACCOUNTS_PER_USER) {
    throw httpError(400, `Maximum ${MAX_ACCOUNTS_PER_USER} accounts allowed per user`);
  }

  const accountNumber = await generateAccountNumber();
  const account = await Account.create({
    userId: req.user.id,
    accountNumber,
    accountType: req.body.accountType || "SAVINGS",
    balance: 0,
    status: "ACTIVE"
  });

  await invalidate(accountListCacheKey(req.user.id));
  await emitEvent(
    TOPICS.TXN_COMPLETED,
    {
      event: "account.created",
      userId: req.user.id,
      accountNumber: account.accountNumber
    },
    account.accountNumber
  );

  res.status(201).json({ message: "Account created successfully", account });
});

const getMyAccountList = asyncHandler(async (req, res) => {
  const cacheKeyName = accountListCacheKey(req.user.id);
  const cached = await getJSON(cacheKeyName);
  if (cached) return res.json(cached);

  const accounts = await Account.find({ userId: req.user.id }).sort({ createdAt: 1 });
  if (!accounts || accounts.length === 0) {
    return res.status(404).json({ message: "No accounts found for this user" });
  }

  await setJSON(cacheKeyName, accounts, LIST_TTL_SECONDS);
  res.json(accounts);
});

const getMyAccount = asyncHandler(async (req, res) => {
  const account = await Account.findOne({
    accountNumber: req.params.accountNumber,
    userId: req.user.id
  });
  if (!account) throw httpError(404, "Account not found");
  res.json(account);
});

const getAllAccounts = asyncHandler(async (req, res) => {
  const accounts = await Account.find().populate("userId", "name email role").sort({ createdAt: -1 });
  res.json(
    accounts.map((account) => ({
      ...account.toObject(),
      user: account.userId
        ? { name: account.userId.name, email: account.userId.email }
        : { name: "Unknown", email: "" }
    }))
  );
});

const updateAccountStatus = asyncHandler(async (req, res) => {
  const { accountNumber, status } = req.body;
  const account = await Account.findOne({ accountNumber });
  if (!account) throw httpError(404, "Account not found");

  account.status = status;
  await account.save();
  await invalidate(accountListCacheKey(account.userId.toString()));
  await emitEvent(TOPICS.ADMIN_ACTION, {
    action: "ACCOUNT_STATUS_CHANGED",
    accountNumber,
    status,
    adminId: req.user.id
  });

  res.json({ message: `Account status updated to ${status}`, account });
});

const UpdateAccountInfo = asyncHandler(async (req, res) => {
  const allowed = ["accountType", "status"];
  const updateFields = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowed.includes(key))
  );

  const account = await Account.findOneAndUpdate(
    { accountNumber: req.params.accountNumber },
    { $set: updateFields },
    { new: true, runValidators: true }
  );
  if (!account) throw httpError(404, "Account not found");

  await invalidate(accountListCacheKey(account.userId.toString()));
  res.json({ message: "Account updated", account });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const account = await Account.findOne({ accountNumber: req.params.accountNumber });
  if (!account) throw httpError(404, "Account not found");
  if (Number(account.balance) !== 0) {
    throw httpError(400, "Only zero-balance accounts can be deleted");
  }

  await Account.deleteOne({ _id: account._id });
  await invalidate(accountListCacheKey(account.userId.toString()));
  await emitEvent(TOPICS.ADMIN_ACTION, {
    action: "ACCOUNT_DELETED",
    accountNumber: account.accountNumber,
    adminId: req.user.id
  });

  res.json({ message: "Account deleted" });
});

module.exports = {
  getMyAccountList,
  getMyAccount,
  createAccount,
  getAllAccounts,
  updateAccountStatus,
  UpdateAccountInfo,
  deleteAccount
};
