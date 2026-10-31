const { z } = require("zod");

const baseSchema = z.object({
  NODE_ENV: z.string().default("development"),
  LOG_LEVEL: z.string().default("info"),
  MONGO_URI: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  KAFKA_BROKERS: z.string().default("localhost:19092"),
  KAFKA_CLIENT_ID: z.string().default("ebank"),
  INTERNAL_SERVICE_TOKEN: z.string().default("dev-internal-token"),
  OTP_PEPPER: z.string().default("dev-otp-pepper"),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  CORS_ORIGINS: z.string().default("*"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().optional(),
  WEBHOOK_ENCRYPTION_KEY: z.string().default("dev-webhook-encryption-key"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("E-Banking <no-reply@ebank.local>"),
  SMS_PROVIDER: z.string().default("console"),
  AUTH_URL: z.string().default("http://localhost:5001"),
  BANKING_URL: z.string().default("http://localhost:5002"),
  PAYMENT_URL: z.string().default("http://localhost:5003"),
  UPI_URL: z.string().default("http://localhost:5004"),
  NOTIFICATION_URL: z.string().default("http://localhost:5005"),
  WEBHOOK_URL: z.string().default("http://localhost:5006"),
  ADMIN_URL: z.string().default("http://localhost:5007")
});

function loadEnv(extra = {}) {
  const parsed = baseSchema.extend(extra).safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`Invalid environment: ${details}`);
  }
  return parsed.data;
}

module.exports = { loadEnv, baseSchema };
