const crypto = require("crypto");
const Order = require("../Models/Order");
const Payment = require("../Models/Payment");
const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const DeveloperAccount = require("../Models/DeveloperAccount");
const asyncHandler = require("../Middleware/asyncHandler");
const httpError = require("../Utils/httpError");
const withTransaction = require("../Utils/withTransaction");
const { fireWebhook } = require("./webhookController");
const logger = require("../Infrastructure/logger");
const { emitEvent } = require("../Infrastructure/events");
const { TOPICS } = require("../Infrastructure/kafka");
const { invalidate, cacheKey } = require("../Infrastructure/redis");

function referenceId(prefix = "TXN") {
  return `${prefix}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

async function invalidateUsers(userIds) {
  await invalidate(...userIds.filter(Boolean).flatMap((id) => [
    cacheKey("accounts", "list", String(id)),
    cacheKey("txns", "me", String(id)),
    cacheKey("txns", "recent", String(id))
  ]));
}

const createOrder = asyncHandler(async (req, res) => {
  const { amount, currency, redirectUrl } = req.body;
  const orderId = `order_${crypto.randomBytes(8).toString("hex")}`;

  const order = await Order.create({
    orderId,
    merchantId: req.merchant.merchantId,
    amount,
    currency: currency || "INR",
    redirectUrl
  });

  res.status(201).json({ success: true, order });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, method, fromAccount } = req.body;
  const order = await Order.findOne({ orderId });
  if (!order) throw httpError(404, "Order not found");
  if (order.status === "PAID") throw httpError(409, "Order already paid");
  if (order.status !== "CREATED") throw httpError(400, `Order cannot be paid in status ${order.status}`);

  const merchant = await DeveloperAccount.findOne({ merchantId: order.merchantId, isActive: true });
  if (!merchant) throw httpError(404, "Merchant not found or inactive");

  const result = await withTransaction(async (session) => {
    const claimedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: "CREATED" },
      { $set: { status: "PAID", customerUserId: req.user.id } },
      { new: true, session }
    );
    if (!claimedOrder) throw httpError(409, "Order already processed");

    const sender = await Account.findOneAndUpdate(
      {
        accountNumber: fromAccount,
        userId: req.user.id,
        status: "ACTIVE",
        balance: { $gte: order.amount }
      },
      { $inc: { balance: -order.amount } },
      { new: true, session }
    );
    if (!sender) {
      const exists = await Account.exists({ accountNumber: fromAccount, userId: req.user.id });
      throw httpError(exists ? 400 : 404, exists ? "Insufficient balance" : "Payer account not found");
    }

    const receiver = await Account.findOneAndUpdate(
      { accountNumber: merchant.accountNumber, status: "ACTIVE" },
      { $inc: { balance: order.amount } },
      { new: true, session }
    );
    if (!receiver) throw httpError(400, "Merchant account is not active");

    const txnReference = referenceId();
    const transaction = await Transaction.create(
      [
        {
          referenceId: txnReference,
          fromAccount: sender.accountNumber,
          toAccount: receiver.accountNumber,
          amount: order.amount,
          type: "TRANSFER",
          initiatedBy: "USER",
          status: "SUCCESS",
          balanceAfterTransaction: sender.balance,
          description: `Payment for order ${orderId}`
        }
      ],
      { session }
    );

    const payment = await Payment.create(
      [
        {
          paymentId: `pay_${crypto.randomBytes(8).toString("hex")}`,
          orderId,
          merchantId: order.merchantId,
          amount: order.amount,
          status: "SUCCESS",
          method: method || "ACCOUNT_BALANCE",
          customerAccountId: sender.accountNumber,
          customerUserId: req.user.id,
          transactionId: txnReference
        }
      ],
      { session }
    );

    return { transaction: transaction[0], payment: payment[0], sender, receiver };
  });

  await invalidateUsers([req.user.id, merchant.userId.toString()]);
  await emitEvent(
    TOPICS.PAYMENT_SUCCEEDED,
    {
      paymentId: result.payment.paymentId,
      orderId,
      merchantId: order.merchantId,
      merchantUserId: merchant.userId.toString(),
      customerUserId: req.user.id,
      amount: order.amount,
      transactionId: result.transaction.referenceId
    },
    result.payment.paymentId
  );
  try {
    await fireWebhook(order.merchantId, "payment.succeeded", {
      payment: result.payment,
      order
    });
  } catch (error) {
    logger.warn({ err: error.message, orderId, merchantId: order.merchantId }, "payment webhook dispatch failed");
  }

  res.json({ success: true, payment: result.payment, order });
});

const refundPayment = asyncHandler(async (req, res) => {
  const { paymentId, orderId } = req.body;
  const payment = await Payment.findOne(paymentId ? { paymentId } : { orderId });
  if (!payment) throw httpError(404, "Payment not found");
  if (payment.merchantId !== req.merchant.merchantId) throw httpError(403, "Not your payment");
  if (payment.status !== "SUCCESS") throw httpError(400, `Payment cannot be refunded in status ${payment.status}`);

  const merchant = await DeveloperAccount.findOne({ merchantId: payment.merchantId });
  const result = await withTransaction(async (session) => {
    const merchantAccount = await Account.findOneAndUpdate(
      {
        accountNumber: merchant.accountNumber,
        status: "ACTIVE",
        balance: { $gte: payment.amount }
      },
      { $inc: { balance: -payment.amount } },
      { new: true, session }
    );
    if (!merchantAccount) throw httpError(400, "Merchant has insufficient balance for refund");

    const customerAccount = await Account.findOneAndUpdate(
      { accountNumber: payment.customerAccountId, status: "ACTIVE" },
      { $inc: { balance: payment.amount } },
      { new: true, session }
    );
    if (!customerAccount) throw httpError(400, "Customer account is not active");

    const refundReference = referenceId("REFUND");
    await Transaction.create(
      [
        {
          referenceId: refundReference,
          fromAccount: merchantAccount.accountNumber,
          toAccount: customerAccount.accountNumber,
          amount: payment.amount,
          type: "REFUND",
          initiatedBy: "SYSTEM",
          status: "SUCCESS",
          balanceAfterTransaction: merchantAccount.balance,
          description: `Refund for order ${payment.orderId}`
        }
      ],
      { session }
    );

    await Payment.updateOne(
      { _id: payment._id },
      { $set: { status: "REFUNDED", refundedAt: new Date(), refundTransactionId: refundReference } },
      { session }
    );
    await Order.updateOne({ orderId: payment.orderId }, { $set: { status: "REFUNDED" } }, { session });

    return { merchantAccount, customerAccount, refundReference };
  });

  await invalidateUsers([merchant.userId.toString(), payment.customerUserId?.toString()]);
  await emitEvent(
    TOPICS.PAYMENT_REFUNDED,
    {
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      merchantId: payment.merchantId,
      customerUserId: payment.customerUserId?.toString(),
      amount: payment.amount,
      refundTransactionId: result.refundReference
    },
    payment.paymentId
  );
  try {
    await fireWebhook(payment.merchantId, "payment.refunded", {
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      amount: payment.amount
    });
  } catch (error) {
    logger.warn(
      { err: error.message, orderId: payment.orderId, merchantId: payment.merchantId },
      "refund webhook dispatch failed"
    );
  }

  res.json({ success: true, refunded: true, transactionId: result.refundReference });
});

const getOrderByOrderId = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) throw httpError(404, "Order not found");

  const merchant = await DeveloperAccount.findOne({ merchantId: order.merchantId }).select("developerName");

  res.json({
    success: true,
    order: {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      redirectUrl: order.redirectUrl,
      merchantName: merchant ? merchant.developerName : "Unknown Merchant"
    }
  });
});

module.exports = {
  createOrder,
  verifyPayment,
  refundPayment,
  getOrderByOrderId
};
