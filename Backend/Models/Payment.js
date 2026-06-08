const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    merchantId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    method: {
      type: String, // "UPI", "ACCOUNT_BALANCE"
    },
    customerAccountId: {
      type: String, // The account number that paid it, if available
    },
    transactionId: {
      type: String, // Linked system transaction ID
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
