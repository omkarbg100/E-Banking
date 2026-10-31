const { z } = require("zod");
const { loadEnv } = require("@ebank/common");

module.exports = loadEnv({
  PORT: z.coerce.number().default(5002),
  MONGO_URI: z.string().default("mongodb://localhost:27017/banking_db?replicaSet=rs0"),
  DEFAULT_DAILY_LIMIT: z.coerce.number().default(200000),
  SETTLEMENT_ACCOUNT_NUMBER: z.string().default("000000000001")
});
