const mongoose = require("mongoose");

const adminActionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    actionType: {
      type: String,
      required: true,
    },

    targetAccount: {
      type: String,
    },

    details: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminAction", adminActionSchema);
