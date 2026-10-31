const crypto = require("crypto");
const UpiProfile = require("../Models/UpiProfile");
const UpiRequest = require("../Models/UpiRequest");
const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const asyncHandler = require("../Middleware/asyncHandler");
const httpError = require("../Utils/httpError");
const withTransaction = require("../Utils/withTransaction");
const { emitEvent } = require("../Infrastructure/events");
const { TOPICS } = require("../Infrastructure/kafka");
const { invalidate, cacheKey } = require("../Infrastructure/redis");

function referenceId() {
  return `TXN-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

async function invalidateUsers(userIds) {
  await invalidate(
    ...userIds.filter(Boolean).flatMap((id) => [
      cacheKey("accounts", "list", String(id)),
      cacheKey("txns", "me", String(id)),
      cacheKey("txns", "recent", String(id))
    ])
  );
}

const createUpiId = asyncHandler(async (req, res) => {
  const { username, accountNumber } = req.body;
  const account = await Account.findOne({ accountNumber, userId: req.user.id });
  if (!account) throw httpError(404, "Account not found or not yours");

  const upiId = `${username}@ebank`.toLowerCase();
  const existing = await UpiProfile.findOne({ $or: [{ upiId }, { accountNumber }] });
  if (existing) throw httpError(409, "UPI ID or linked account already registered");

  const profile = await UpiProfile.create({ upiId, userId: req.user.id, accountNumber });
  res.status(201).json({ success: true, profile });
});

const scanAndPay = asyncHandler(async (req, res) => {
  const { toUpiId, amount, fromAccount, idempotencyKey } = req.body;
  if (fromAccount === undefined) throw httpError(400, "fromAccount is required");

  const receiverProfile = await UpiProfile.findOne({ upiId: toUpiId.toLowerCase(), isActive: true });
  if (!receiverProfile) throw httpError(404, "Receiver UPI ID not found");

  const result = await withTransaction(async (session) => {
    const receiver = await Account.findOne({ accountNumber: receiverProfile.accountNumber, status: "ACTIVE" }).session(
      session
    );
    if (!receiver) throw httpError(404, "Receiver account is not active");

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
    if (!updatedReceiver) throw httpError(404, "Receiver account is not active");

    const transaction = await Transaction.create(
      [
        {
          referenceId: referenceId(),
          idempotencyKey:
            idempotencyKey || req.headers["idempotency-key"] || `upi:${crypto.randomUUID()}`,
          fromAccount: sender.accountNumber,
          toAccount: updatedReceiver.accountNumber,
          amount,
          type: "TRANSFER",
          initiatedBy: "USER",
          status: "SUCCESS",
          balanceAfterTransaction: sender.balance,
          description: `UPI payment to ${toUpiId}`
        }
      ],
      { session }
    );

    return { sender, receiver: updatedReceiver, transaction: transaction[0] };
  });

  await invalidateUsers([req.user.id, receiverProfile.userId.toString()]);
  await emitEvent(
    TOPICS.TXN_COMPLETED,
    {
      transactionId: result.transaction._id.toString(),
      referenceId: result.transaction.referenceId,
      type: "TRANSFER",
      amount,
      senderUserId: req.user.id,
      receiverUserId: receiverProfile.userId.toString(),
      fromAccount,
      toAccount: result.receiver.accountNumber
    },
    result.transaction.referenceId
  );

  res.json({ success: true, transaction: result.transaction, balance: result.sender.balance });
});

const createCollectRequest = asyncHandler(async (req, res) => {
  const { payerUpiId, amount, description } = req.body;
  const requesterProfile = await UpiProfile.findOne({ userId: req.user.id });
  if (!requesterProfile) throw httpError(404, "You do not have a UPI ID");

  const payerProfile = await UpiProfile.findOne({ upiId: payerUpiId.toLowerCase(), isActive: true });
  if (!payerProfile) throw httpError(404, "Payer UPI ID not found");
  if (payerProfile.userId.toString() === req.user.id) {
    throw httpError(400, "Cannot request money from yourself");
  }

  const request = await UpiRequest.create({
    requestId: `req_${crypto.randomBytes(6).toString("hex")}`,
    requesterUpiId: requesterProfile.upiId,
    payerUpiId: payerProfile.upiId,
    amount,
    description,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  res.status(201).json({ success: true, request });
});

const getPendingRequests = asyncHandler(async (req, res) => {
  const profile = await UpiProfile.findOne({ userId: req.user.id });
  if (!profile) return res.json({ success: true, requests: [] });

  const requests = await UpiRequest.find({
    payerUpiId: profile.upiId,
    status: "PENDING",
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }]
  })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, requests });
});

const approveCollectRequest = asyncHandler(async (req, res) => {
  const { requestId, fromAccount } = req.body;
  const request = await UpiRequest.findOne({ requestId, status: "PENDING" });
  if (!request) throw httpError(404, "Request not found or already processed");

  const payerProfile = await UpiProfile.findOne({ upiId: request.payerUpiId, userId: req.user.id });
  if (!payerProfile) throw httpError(403, "Not your request to approve");

  const requesterProfile = await UpiProfile.findOne({ upiId: request.requesterUpiId });
  if (!requesterProfile) throw httpError(404, "Requester UPI profile not found");

  const result = await withTransaction(async (session) => {
    const claimed = await UpiRequest.findOneAndUpdate(
      { _id: request._id, status: "PENDING" },
      { $set: { status: "APPROVED", transactionId: referenceId() } },
      { new: true, session }
    );
    if (!claimed) throw httpError(409, "Request already processed");

    const sender = await Account.findOneAndUpdate(
      {
        accountNumber: fromAccount || payerProfile.accountNumber,
        userId: req.user.id,
        status: "ACTIVE",
        balance: { $gte: request.amount }
      },
      { $inc: { balance: -request.amount } },
      { new: true, session }
    );
    if (!sender) throw httpError(400, "Insufficient balance or inactive account");

    const receiver = await Account.findOneAndUpdate(
      { accountNumber: requesterProfile.accountNumber, status: "ACTIVE" },
      { $inc: { balance: request.amount } },
      { new: true, session }
    );
    if (!receiver) throw httpError(404, "Requester account is not active");

    const transaction = await Transaction.create(
      [
        {
          referenceId: claimed.transactionId,
          idempotencyKey: req.headers["idempotency-key"] || `upi-request:${request.requestId}`,
          fromAccount: sender.accountNumber,
          toAccount: receiver.accountNumber,
          amount: request.amount,
          type: "TRANSFER",
          initiatedBy: "USER",
          status: "SUCCESS",
          balanceAfterTransaction: sender.balance,
          description: `UPI collect approved for ${request.requesterUpiId}`
        }
      ],
      { session }
    );

    return { sender, receiver, transaction: transaction[0] };
  });

  await invalidateUsers([req.user.id, requesterProfile.userId.toString()]);
  await emitEvent(
    TOPICS.TXN_COMPLETED,
    {
      transactionId: result.transaction._id.toString(),
      referenceId: result.transaction.referenceId,
      type: "TRANSFER",
      amount: request.amount,
      senderUserId: req.user.id,
      receiverUserId: requesterProfile.userId.toString(),
      fromAccount: result.sender.accountNumber,
      toAccount: result.receiver.accountNumber
    },
    result.transaction.referenceId
  );

  res.json({ success: true, request, transaction: result.transaction });
});

const resolveUpi = asyncHandler(async (req, res) => {
  const profile = await UpiProfile.findOne({ upiId: req.params.upiId.toLowerCase(), isActive: true }).populate(
    "userId",
    "name"
  );
  if (!profile) throw httpError(404, "UPI ID not found");
  res.json({
    success: true,
    profile: {
      upiId: profile.upiId,
      accountNumber: profile.accountNumber,
      name: profile.userId?.name || "Unknown"
    }
  });
});

module.exports = {
  createUpiId,
  scanAndPay,
  createCollectRequest,
  getPendingRequests,
  approveCollectRequest,
  resolveUpi
};
