const mongoose = require("mongoose");

const upiProfileSchema = new mongoose.Schema(
  {
    upiId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountNumber: {
      type: String,
      required: true, // The bank account linked to this UPI ID
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UpiProfile", upiProfileSchema);
