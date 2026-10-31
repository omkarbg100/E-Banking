const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    orderId: {
      type: String,
      required: true,
      index: true
    },
    merchantId: {
      type: String,
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true
    },
    method: {
      type: String
    },
    customerAccountId: {
      type: String
    },
    customerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    transactionId: {
      type: String
    },
    refundedAt: Date,
    refundTransactionId: String
  },
  { timestamps: true }
);

paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
