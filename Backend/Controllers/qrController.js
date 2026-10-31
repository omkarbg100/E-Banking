const crypto = require("crypto");
const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const User = require("../Models/User");
const asyncHandler = require("../Middleware/asyncHandler");
const httpError = require("../Utils/httpError");
const withTransaction = require("../Utils/withTransaction");
const { emitEvent } = require("../Infrastructure/events");
const { TOPICS } = require("../Infrastructure/kafka");
const { invalidate, cacheKey } = require("../Infrastructure/redis");

async function invalidateUsers(userIds) {
  await invalidate(
    ...userIds.filter(Boolean).flatMap((id) => [
      cacheKey("accounts", "list", String(id)),
      cacheKey("txns", "me", String(id)),
      cacheKey("txns", "recent", String(id))
    ])
  );
}

const payViaQR = asyncHandler(async (req, res) => {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
  if (fromAccount === toAccount) throw httpError(400, "Cannot pay to the same account");

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
    if (!updatedReceiver) throw httpError(404, "Receiver account is not active");

    const transaction = await Transaction.create(
      [
        {
          referenceId: `TXN-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
          idempotencyKey:
            idempotencyKey || req.headers["idempotency-key"] || `qr:${crypto.randomUUID()}`,
          fromAccount,
          toAccount,
          amount,
          type: "TRANSFER",
          initiatedBy: "USER",
          status: "SUCCESS",
          balanceAfterTransaction: sender.balance,
          description: "QR payment"
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
    message: "QR payment successful",
    balance: result.sender.balance,
    transaction: result.transaction
  });
});

const getMyQRCode = asyncHandler(async (req, res) => {
  const account = await Account.findOne({ userId: req.user.id, status: "ACTIVE" });
  if (!account) throw httpError(404, "Active account not found");

  const user = await User.findById(req.user.id).select("name email");
  res.json({
    qrData: {
      accountNumber: account.accountNumber,
      name: user?.name || "",
      bank: "E-Banking"
    }
  });
});

module.exports = { payViaQR, getMyQRCode };
