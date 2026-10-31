const mongoose = require("mongoose");

const webhookDeliverySchema = new mongoose.Schema(
  {
    webhookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Webhook",
      required: true,
      index: true
    },
    merchantId: {
      type: String,
      required: true,
      index: true
    },
    event: {
      type: String,
      required: true
    },
    eventId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    responseStatus: Number,
    error: String
  },
  { timestamps: true }
);

webhookDeliverySchema.index({ merchantId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("WebhookDelivery", webhookDeliverySchema);
