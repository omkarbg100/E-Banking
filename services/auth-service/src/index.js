require("dotenv").config();
const crypto = require("crypto");
const { startTracing } = require("@ebank/common/tracing");
startTracing("auth-service");

const {
  createLogger,
  connectMongo,
  createRedis,
  waitForRedis,
  createKafka,
  createProducer,
  initJwt
} = require("@ebank/common");
const config = require("./config");
const state = require("./state");
const { User } = require("./models");
const { createApp } = require("./app");

const logger = createLogger("auth-service", config.LOG_LEVEL);

function normalizePem(value) {
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

async function ensureKeys(redis) {
  if (config.JWT_PRIVATE_KEY && config.JWT_PUBLIC_KEY) {
    return {
      privateKey: normalizePem(config.JWT_PRIVATE_KEY),
      publicKey: normalizePem(config.JWT_PUBLIC_KEY)
    };
  }
  const storedPrivate = await redis.get("auth:jwt_private_key");
  const storedPublic = await redis.get("auth:jwt_public_key");
  if (storedPrivate && storedPublic) {
    logger.info("loaded RSA keys from redis");
    return { privateKey: storedPrivate, publicKey: storedPublic };
  }
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });
  await redis.set("auth:jwt_private_key", privateKey);
  await redis.set("auth:jwt_public_key", publicKey);
  logger.info("generated RSA keypair and stored in redis");
  return { privateKey, publicKey };
}

async function seedAdmin(logger) {
  if (!config.ADMIN_EMAIL || !config.ADMIN_PASSWORD) {
    logger.info("admin seed skipped (ADMIN_EMAIL/ADMIN_PASSWORD not set)");
    return;
  }
  const email = config.ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    logger.info({ email }, "admin already exists");
    return;
  }
  await User.create({
    name: "Platform Admin",
    email,
    password: config.ADMIN_PASSWORD,
    role: "ADMIN",
    emailVerifiedAt: new Date()
  });
  logger.info({ email }, "admin user seeded");
}

async function main() {
  state.config = config;
  state.logger = logger;

  await connectMongo(config.MONGO_URI, "auth-service");
  const redis = createRedis(config.REDIS_URL);
  await waitForRedis(redis);
  state.redis = redis;

  const keys = await ensureKeys(redis);
  state.privateKey = keys.privateKey;
  state.publicKey = keys.publicKey;
  await redis.set("auth:jwt_public_key", keys.publicKey);
  await initJwt(redis, keys.publicKey);

  await seedAdmin(logger);

  const kafka = createKafka(config.KAFKA_CLIENT_ID, config.KAFKA_BROKERS);
  createProducer(kafka, logger)
    .then((producer) => {
      state.producer = producer;
      logger.info("kafka producer connected");
    })
    .catch((err) => logger.warn({ err: err.message }, "kafka producer unavailable, using HTTP fallback"));

  const app = createApp();
  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, "auth-service listening");
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, "shutting down auth-service");
    server.close();
    try {
      if (state.producer) await state.producer.disconnect();
      await redis.quit();
    } catch (err) {
      logger.warn({ err: err.message }, "shutdown cleanup error");
    }
    const { disconnectMongo } = require("@ebank/common");
    await disconnectMongo();
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err }, "auth-service failed to start");
  process.exit(1);
});
