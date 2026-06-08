const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },
    secret: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Webhook", webhookSchema);
