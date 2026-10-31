const REQUIRED_IN_PRODUCTION = ["MONGO_URI", "JWT_SECRET"];

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/ebank?replicaSet=rs0",
  MONGO_DB_NAME: process.env.MONGO_DB_NAME || undefined,

  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  REDIS_PREFIX: process.env.REDIS_PREFIX || "ebank",

  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || "")
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean),
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || "ebank-backend",
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || "ebank-backend-consumer",
  KAFKA_ENABLED: process.env.KAFKA_ENABLED !== "false",

  JWT_SECRET: process.env.JWT_SECRET || "development-only-secret-change-me-please-123456",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:8080")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 1025),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "E-Banking <no-reply@ebank.local>",
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || "",

  OTP_TTL_SECONDS: Number(process.env.OTP_TTL_SECONDS || 600),
  OTP_MAX_ATTEMPTS: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  OTP_PEPPER: process.env.OTP_PEPPER || "ebank-otp-pepper",

  WEBHOOK_TIMEOUT_MS: Number(process.env.WEBHOOK_TIMEOUT_MS || 8000),
  WEBHOOK_ALLOW_PRIVATE: process.env.WEBHOOK_ALLOW_PRIVATE === "true",
  WEBHOOK_MAX_ATTEMPTS: Number(process.env.WEBHOOK_MAX_ATTEMPTS || 5),

  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  TRUST_PROXY: process.env.TRUST_PROXY !== "false",
  SHUTDOWN_TIMEOUT_MS: Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000)
};

if (env.NODE_ENV === "production") {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }
}

env.KAFKA_READY = env.KAFKA_ENABLED && env.KAFKA_BROKERS.length > 0;
env.SMTP_READY = Boolean(env.SMTP_HOST || env.EMAIL_SERVICE);

module.exports = env;
