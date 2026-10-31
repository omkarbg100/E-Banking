const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    url: {
      type: String,
      required: true
    },
    secret: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    failureCount: {
      type: Number,
      default: 0
    },
    lastDeliveryAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Webhook", webhookSchema);
