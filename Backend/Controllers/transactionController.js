const crypto = require("crypto");
const mongoose = require("mongoose");
const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const asyncHandler = require("../Middleware/asyncHandler");
const httpError = require("../Utils/httpError");
const { emitEvent } = require("../Infrastructure/events");
const { TOPICS } = require("../Infrastructure/kafka");
const { getJSON, setJSON, cacheKey, invalidate } = require("../Infrastructure/redis");

const MAX_TRANSFER_AMOUNT = 1000000;

function generateRefId() {
  return `TXN-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

function txnCacheKeys(userId) {
  return [
    cacheKey("accounts", "list", String(userId)),
    cacheKey("txns", "me", String(userId)),
    cacheKey("txns", "recent", String(userId))
  ];
}

async function invalidateUsers(userIds) {
  const keys = [...new Set(userIds.filter(Boolean).map(String))].flatMap(txnCacheKeys);
  await invalidate(...keys);
}

async function withTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

function validateAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_TRANSFER_AMOUNT) {
    throw httpError(400, `Amount must be between 0.01 and ${MAX_TRANSFER_AMOUNT}`);
  }
  return Math.round(value * 100) / 100;
}

const creditMoney = asyncHandler(async (req, res) => {
  const amount = validateAmount(req.body.amount);
  const accountNumber = req.body.accountNumber;
  const idempotencyKey =
    req.headers["idempotency-key"] || req.body.idempotencyKey || `credit:${req.user.id}:${generateRefId()}`;

  const result = await withTransaction(async (session) => {
    const account = await Account.findOneAndUpdate(
      { accountNumber, userId: req.user.id, status: "ACTIVE" },
      { $inc: { balance: amount } },
      { new: true, session, runValidators: true }
    );
    if (!account) throw httpError(404, "Account not found or inactive");

    const transaction = await Transaction.create(
      [
        {
          referenceId: generateRefId(),
          idempotencyKey,
          fromAccount: null,
          toAccount: accountNumber,
          amount,
          type: "CREDIT",
          initiatedBy: "USER",
          status: "SUCCESS",
          balanceAfterTransaction: account.balance,
          description: "Money credited"
        }
      ],
      { session }
    );

    return { account, transaction: transaction[0] };
  });

  await invalidateUsers([req.user.id]);
  await emitEvent(
    TOPICS.TXN_COMPLETED,
    {
      transactionId: result.transaction._id.toString(),
      referenceId: result.transaction.referenceId,
      type: "CREDIT",
      amount,
      senderUserId: null,
      receiverUserId: req.user.id,
      fromAccount: null,
      toAccount: accountNumber
    },
    result.transaction.referenceId
  );

  res.json({ message: "Money credited", balance: result.account.balance, transaction: result.transaction });
});

const transferMoney = asyncHandler(async (req, res) => {
  const fromAccount = req.body.fromAccount || req.body.fromAccountNumber;
  const toAccount = req.body.toAccount || req.body.toAccountNumber;
  const amount = validateAmount(req.body.amount);

  if (!fromAccount || !toAccount) throw httpError(400, "fromAccount and toAccount are required");
  if (fromAccount === toAccount) throw httpError(400, "Same account transfer not allowed");

  const idempotencyKey =
    req.headers["idempotency-key"] || req.body.idempotencyKey || `transfer:${generateRefId()}`;

  const result = await withTransaction(async (session) => {
    const receiver = await Account.findOne({ accountNumber: toAccount, status: "ACTIVE" }).session(session);
    if (!receiver) throw httpError(404, "Receiver account not found or inactive");

    const sender = await Account.findOneAndUpdate(
      {
        accountNumber: fromAccount,
        userId: req.user.id,
        status: "ACTIVE",
        balance: { $gte: amount }
      },
      { $inc: { balance: -amount } },
      { new: true, session }
    );
    if (!sender) {
      const exists = await Account.exists({ accountNumber: fromAccount, userId: req.user.id });
      throw httpError(exists ? 400 : 404, exists ? "Insufficient balance" : "Sender account not found");
    }

    const updatedReceiver = await Account.findOneAndUpdate(
      { _id: receiver._id, status: "ACTIVE" },
      { $inc: { balance: amount } },
      { new: true, session }
    );
    if (!updatedReceiver) throw httpError(404, "Receiver account not found or inactive");

    const transaction = await Transaction.create(
      [
        {
          referenceId: generateRefId(),
          idempotencyKey,
          fromAccount,
          toAccount,
          amount,
          type: "TRANSFER",
          initiatedBy: "USER",
          status: "SUCCESS",
          balanceAfterTransaction: sender.balance,
          description: req.body.description || "User transfer"
        }
      ],
      { session }
    );

    return { sender, receiver: updatedReceiver, transaction: transaction[0] };
  });

  await invalidateUsers([req.user.id, result.receiver.userId.toString()]);
  await emitEvent(
    TOPICS.TXN_COMPLETED,
    {
      transactionId: result.transaction._id.toString(),
      referenceId: result.transaction.referenceId,
      type: "TRANSFER",
      amount,
      senderUserId: req.user.id,
      receiverUserId: result.receiver.userId.toString(),
      fromAccount,
      toAccount
    },
    result.transaction.referenceId
  );

  res.json({
    message: "Transfer successful",
    balance: result.sender.balance,
    transaction: result.transaction
  });
});

const adminAdjustBalance = asyncHandler(async (req, res) => {
  const amount = validateAmount(req.body.amount);
  const { accountNumber, action } = req.body;
  const idempotencyKey =
    req.headers["idempotency-key"] || req.body.idempotencyKey || `admin-adjust:${generateRefId()}`;

  const result = await withTransaction(async (session) => {
    const update = action === "CREDIT" ? { $inc: { balance: amount } } : { $inc: { balance: -amount } };
    const filter = { accountNumber };
    if (action === "DEBIT") filter.balance = { $gte: amount };

    const account = await Account.findOneAndUpdate(filter, update, {
      new: true,
      session,
      runValidators: true
    });

    if (!account) {
      const exists = await Account.exists({ accountNumber });
      throw httpError(exists ? 400 : 404, exists ? "Insufficient balance" : "Account not found");
    }

    const transaction = await Transaction.create(
      [
        {
          referenceId: generateRefId(),
          idempotencyKey,
          fromAccount: action === "DEBIT" ? accountNumber : null,
          toAccount: action === "CREDIT" ? accountNumber : null,
          amount,
          type: "ADMIN_ADJUST",
          initiatedBy: "ADMIN",
          status: "SUCCESS",
          balanceAfterTransaction: account.balance,
          description: `Admin ${action.toLowerCase()}`
        }
      ],
      { session }
    );

    return { account, transaction: transaction[0] };
  });

  await invalidateUsers([result.account.userId.toString()]);
  await emitEvent(TOPICS.ADMIN_ACTION, {
    action: `BALANCE_${action}`,
    accountNumber,
    amount,
    adminId: req.user.id,
    transactionId: result.transaction._id.toString()
  });
  await emitEvent(TOPICS.TXN_COMPLETED, {
    transactionId: result.transaction._id.toString(),
    referenceId: result.transaction.referenceId,
    type: "ADMIN_ADJUST",
    amount,
    senderUserId: action === "DEBIT" ? result.account.userId.toString() : null,
    receiverUserId: action === "CREDIT" ? result.account.userId.toString() : null,
    fromAccount: action === "DEBIT" ? accountNumber : null,
    toAccount: action === "CREDIT" ? accountNumber : null
  });

  res.json({ message: "Account adjusted", balance: result.account.balance, transaction: result.transaction });
});

const getMyTransactions = asyncHandler(async (req, res) => {
  const cacheKeyName = cacheKey("txns", "me", String(req.user.id));
  const cached = await getJSON(cacheKeyName);
  if (cached) return res.json(cached);

  const accounts = await Account.find({ userId: req.user.id }).select("accountNumber").lean();
  const accountNumbers = accounts.map((account) => account.accountNumber);

  const transactions = await Transaction.find({
    $or: [{ fromAccount: { $in: accountNumbers } }, { toAccount: { $in: accountNumbers } }]
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  await setJSON(cacheKeyName, transactions, 15);
  res.json(transactions);
});

const getTopRecentAccountsForUser = asyncHandler(async (req, res) => {
  const cacheKeyName = cacheKey("txns", "recent", String(req.user.id));
  const cached = await getJSON(cacheKeyName);
  if (cached) return res.json(cached);

  const userAccounts = await Account.find({ userId: req.user.id }).select("accountNumber -_id").lean();
  const accountNumbers = userAccounts.map((account) => account.accountNumber);

  if (accountNumbers.length === 0) {
    return res.status(200).json({ success: true, count: 0, accounts: [] });
  }

  const recentAccounts = await Transaction.aggregate([
    {
      $match: {
        status: "SUCCESS",
        $or: [{ fromAccount: { $in: accountNumbers } }, { toAccount: { $in: accountNumbers } }]
      }
    },
    {
      $addFields: {
        otherAccount: {
          $cond: [{ $in: ["$fromAccount", accountNumbers] }, "$toAccount", "$fromAccount"]
        }
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$otherAccount",
        lastTransactionAt: { $first: "$createdAt" },
        lastAmount: { $first: "$amount" },
        lastTransactionId: { $first: "$_id" }
      }
    },
    { $sort: { lastTransactionAt: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "accounts",
        localField: "_id",
        foreignField: "accountNumber",
        as: "accountInfo"
      }
    },
    { $unwind: { path: "$accountInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "accountInfo.userId",
        foreignField: "_id",
        as: "userInfo"
      }
    },
    { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        accountNumber: "$_id",
        lastTransactionAt: 1,
        lastAmount: 1,
        lastTransactionId: 1,
        accountHolderName: "$userInfo.name"
      }
    }
  ]);

  const payload = {
    success: true,
    count: recentAccounts.length,
    accounts: recentAccounts.map((account) => ({
      accountHolderName: account.accountHolderName || "Unknown",
      accountNumber: account.accountNumber,
      lastTransaction: account.lastTransactionAt,
      lastAmount: account.lastAmount,
      transactionId: account.lastTransactionId
    }))
  };

  await setJSON(cacheKeyName, payload, 30);
  res.status(200).json(payload);
});

const getTransactionsBetweenAccounts = asyncHandler(async (req, res) => {
  const { toAccount } = req.query;
  if (!toAccount) throw httpError(400, "toAccount is required");

  const userAccounts = await Account.find({ userId: req.user.id }).select("accountNumber -_id").lean();
  const userAccountNumbers = userAccounts.map((account) => account.accountNumber);
  if (userAccountNumbers.length === 0) return res.json({ count: 0, transactions: [] });

  const transactions = await Transaction.find({
    status: "SUCCESS",
    $or: [
      { fromAccount: { $in: userAccountNumbers }, toAccount },
      { fromAccount: toAccount, toAccount: { $in: userAccountNumbers } }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const enriched = transactions.map((transaction) => {
    const direction = transaction.toAccount === toAccount ? "SENT" : "RECEIVED";
    return {
      _id: transaction._id,
      amount: transaction.amount,
      description: transaction.description,
      type: transaction.type,
      status: transaction.status,
      createdAt: transaction.createdAt,
      direction,
      sentTo: direction === "SENT" ? toAccount : null,
      receivedFrom: direction === "RECEIVED" ? toAccount : null
    };
  });

  res.json({ count: enriched.length, transactions: enriched });
});

module.exports = {
  creditMoney,
  transferMoney,
  getMyTransactions,
  adminAdjustBalance,
  getTopRecentAccountsForUser,
  getTransactionsBetweenAccounts
};
