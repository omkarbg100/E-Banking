const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    fromAccount: {
      type: String,
      default: null,
      index: true
    },
    toAccount: {
      type: String,
      default: null,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT", "TRANSFER", "ADMIN_ADJUST", "REFUND"],
      required: true
    },
    initiatedBy: {
      type: String,
      enum: ["USER", "ADMIN", "SYSTEM"],
      required: true
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
      default: "SUCCESS",
      index: true
    },
    balanceAfterTransaction: {
      type: Number
    },
    description: {
      type: String,
      maxlength: 500
    }
  },
  { timestamps: true }
);

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ fromAccount: 1, createdAt: -1 });
transactionSchema.index({ toAccount: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
