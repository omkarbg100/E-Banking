const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    accountType: {
      type: String,
      enum: ["SAVINGS", "CURRENT"],
      default: "SAVINGS"
    },
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ["ACTIVE", "FROZEN", "CLOSED"],
      default: "ACTIVE",
      index: true
    },
    qrCode: {
      type: String
    }
  },
  { timestamps: true }
);

accountSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Account", accountSchema);
