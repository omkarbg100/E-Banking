const Order = require("../Models/Order");
const Payment = require("../Models/Payment");
const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const crypto = require("crypto");
const DeveloperAccount = require("../Models/DeveloperAccount");
const { fireWebhook } = require("./webhookController");

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency, redirectUrl } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const orderId = "order_" + crypto.randomBytes(8).toString("hex");

    const order = await Order.create({
      orderId,
      merchantId: req.merchant.merchantId,
      amount,
      currency: currency || "INR",
      redirectUrl
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
   try {
     const { orderId, method, fromAccount } = req.body;
     const order = await Order.findOne({ orderId });
     if (!order) return res.status(404).json({ message: "Order not found" });
     if (order.status === "PAID") return res.status(400).json({ message: "Order already paid" });
     
     // Normally SDK generates a payment token and verifies it. Here we simulate transferring directly.
     const sender = await Account.findOne({ accountNumber: fromAccount, status: "ACTIVE" });
     if (!sender) return res.status(404).json({ message: "Payer account not found" });
     if (sender.balance < order.amount) return res.status(400).json({ message: "Insufficient balance" });

     const merchantDev = await DeveloperAccount.findOne({ merchantId: order.merchantId });
     const receiver = await Account.findOne({ accountNumber: merchantDev.accountNumber });

     // Execute Transaction
     sender.balance -= order.amount;
     receiver.balance += order.amount;
     await sender.save();
     await receiver.save();

     const transactionId = "TXN-" + crypto.randomBytes(6).toString("hex").toUpperCase();
     await Transaction.create({
       referenceId: transactionId,
       fromAccount: sender.accountNumber,
       toAccount: receiver.accountNumber,
       amount: order.amount,
       type: "TRANSFER",
       initiatedBy: "USER",
       balanceAfterTransaction: sender.balance,
       description: `Payment for Order ${orderId}`
     });

     const paymentId = "pay_" + crypto.randomBytes(8).toString("hex");
     const payment = await Payment.create({
       paymentId,
       orderId,
       merchantId: order.merchantId,
       amount: order.amount,
       status: "SUCCESS",
       method: method || "ACCOUNT_BALANCE",
       customerAccountId: sender.accountNumber,
       transactionId
     });

     order.status = "PAID";
     await order.save();

     // Fire webhook
     await fireWebhook(order.merchantId, "payment.success", { payment, order });

     res.json({ success: true, payment, order });
   } catch (error) {
     res.status(500).json({ message: error.message });
   }
};

exports.refundPayment = async (req, res) => {
    // Basic refund implementation
    res.status(501).json({ message: "Refunds not yet implemented fully." });
};

exports.getOrderByOrderId = async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await Order.findOne({ orderId });
      if (!order) return res.status(404).json({ message: "Order not found" });

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
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};
