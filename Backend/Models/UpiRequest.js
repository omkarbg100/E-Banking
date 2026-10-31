const mongoose = require("mongoose");

const upiRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true
    },
    requesterUpiId: {
      type: String,
      required: true,
      index: true
    },
    payerUpiId: {
      type: String,
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "EXPIRED"],
      default: "PENDING",
      index: true
    },
    description: {
      type: String,
      maxlength: 300
    },
    transactionId: {
      type: String
    },
    expiresAt: {
      type: Date
    }
  },
  { timestamps: true }
);

upiRequestSchema.index({ payerUpiId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("UpiRequest", upiRequestSchema);
