const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      unique: true,
      required: true,
    },

    fromAccount: {
      type: String,
      default: null,
    },

    toAccount: {
      type: String,
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    type: {
      type: String,
      enum: ["CREDIT", "DEBIT", "TRANSFER", "ADMIN_ADJUST"],
      required: true,
    },

    initiatedBy: {
      type: String,
      enum: ["USER", "ADMIN"],
      required: true,
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },

    balanceAfterTransaction: {
      type: Number,
    },

    description: {
      type: String,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ fromAccount: 1 });
transactionSchema.index({ toAccount: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
