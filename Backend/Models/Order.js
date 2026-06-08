const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    merchantId: {
      type: String,
      required: true,
      ref: "DeveloperAccount"
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["CREATED", "PAID", "FAILED", "REFUNDED"],
      default: "CREATED",
    },
    receiptId: {
      type: String,
    },
    redirectUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
