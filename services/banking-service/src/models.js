const mongoose = require("mongoose");
const Decimal = mongoose.Types.Decimal128;

const accountSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    accountNumber: { type: String, required: true, unique: true },
    accountType: { type: String, enum: ["SAVINGS", "CURRENT"], default: "SAVINGS" },
    accountName: { type: String, required: true },
    balance: { type: Decimal, default: Decimal.fromString("0") },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["ACTIVE", "FROZEN", "CLOSED"], default: "ACTIVE" },
    bankName: { type: String, default: "E-Banking" },
    ifsc: { type: String, default: "EBAN0000001" },
    dailyLimit: { type: Number, default: 200000 },
    system: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const entrySchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
    direction: { type: String, enum: ["DEBIT", "CREDIT"], required: true },
    amount: { type: Decimal, required: true },
    balanceAfter: { type: Decimal, required: true }
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["TRANSFER", "DEPOSIT", "WITHDRAWAL", "PAYMENT", "UPI", "REFUND", "REVERSAL"],
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
      default: "COMPLETED"
    },
    fromAccount: { type: String },
    toAccount: { type: String },
    fromAccountId: { type: mongoose.Schema.Types.ObjectId },
    toAccountId: { type: mongoose.Schema.Types.ObjectId },
    amount: { type: Decimal, required: true },
    currency: { type: String, default: "INR" },
    description: { type: String },
    idempotencyKey: { type: String, unique: true, sparse: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    failureReason: { type: String },
    entries: { type: [entrySchema], default: [] }
  },
  { timestamps: true }
);

transactionSchema.index({ fromAccount: 1, createdAt: -1 });
transactionSchema.index({ toAccount: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

const ledgerSchema = new mongoose.Schema(
  {
    transactionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    reference: { type: String, required: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountNumber: { type: String, required: true },
    direction: { type: String, enum: ["DEBIT", "CREDIT"], required: true },
    amount: { type: Decimal, required: true },
    balanceAfter: { type: Decimal, required: true }
  },
  { timestamps: true }
);

ledgerSchema.index({ accountId: 1, createdAt: -1 });

function moneyToJSON(value) {
  if (value === null || value === undefined) return value;
  return value.toString();
}

accountSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    userId: this.userId,
    accountNumber: this.accountNumber,
    accountType: this.accountType,
    accountName: this.accountName,
    balance: moneyToJSON(this.balance),
    currency: this.currency,
    status: this.status,
    bankName: this.bankName,
    ifsc: this.ifsc,
    dailyLimit: this.dailyLimit,
    createdAt: this.createdAt
  };
};

transactionSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    reference: this.reference,
    type: this.type,
    status: this.status,
    fromAccount: this.fromAccount,
    toAccount: this.toAccount,
    amount: moneyToJSON(this.amount),
    currency: this.currency,
    description: this.description,
    metadata: this.metadata,
    failureReason: this.failureReason,
    createdAt: this.createdAt
  };
};

const Account = mongoose.model("Account", accountSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);
const LedgerEntry = mongoose.model("LedgerEntry", ledgerSchema);

module.exports = { Account, Transaction, LedgerEntry, moneyToJSON };
