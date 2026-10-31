const mongoose = require("mongoose");

const developerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    developerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    accountNumber: {
      type: String,
      required: true
    },
    merchantId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    publicKey: {
      type: String,
      required: true,
      unique: true
    },
    secretKeyHash: {
      type: String,
      index: true
    },
    secretKeyPreview: {
      type: String
    },
    secretKey: {
      type: String,
      select: false
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeveloperAccount", developerSchema);
