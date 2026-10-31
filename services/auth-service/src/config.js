const { z } = require("zod");
const { loadEnv } = require("@ebank/common");

module.exports = loadEnv({
  PORT: z.coerce.number().default(5001),
  MONGO_URI: z.string().default("mongodb://localhost:27017/auth_db?replicaSet=rs0"),
  COOKIE_SECRET: z.string().default("dev-cookie-secret"),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional()
});
