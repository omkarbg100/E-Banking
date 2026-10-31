const mongoose = require("mongoose");
const { ApiError } = require("@ebank/common");

const Decimal = mongoose.Types.Decimal128;

function toDecimal(value) {
  if (value === null || value === undefined || value === "") {
    throw new ApiError(400, "Amount is required");
  }
  const num = Number(value);
  if (!Number.isFinite(num)) throw new ApiError(400, "Invalid amount");
  if (num <= 0) throw new ApiError(400, "Amount must be greater than zero");
  if (num > 10000000) throw new ApiError(400, "Amount exceeds maximum allowed");
  return Decimal.fromString(num.toFixed(2));
}

function decimalCompare(a, b) {
  return Decimal.fromString(String(a)).toString() === Decimal.fromString(String(b)).toString()
    ? 0
    : Number(a.toString()) - Number(b.toString());
}

function isPositive(decimal) {
  return Number(decimal.toString()) > 0;
}

module.exports = { toDecimal, decimalCompare, isPositive, Decimal };
