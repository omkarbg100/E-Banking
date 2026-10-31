require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");
const env = require("./Config/env");
const logger = require("./Infrastructure/logger");
const connectDB = require("./Config/Db");
const { connectRedis, closeRedis } = require("./Infrastructure/redis");
const { connectProducer, disconnectKafka } = require("./Infrastructure/kafka");
const { createQueues, startWorkers, closeQueues } = require("./Infrastructure/queue");
const { startEventConsumer } = require("./Consumers/eventConsumer");
const { ensureAdmin } = require("./Config/bootstrap");

let server;

async function startServer() {
  await connectDB();
  await connectRedis();

  await connectProducer();
  createQueues();
  startWorkers();
  await startEventConsumer();
  await ensureAdmin();

  server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "server running");
  });

  return server;
}

async function shutdown(signal) {
  logger.info({ signal }, "shutting down");
  const timer = setTimeout(() => {
    logger.error("graceful shutdown timed out");
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);
  timer.unref();

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeQueues();
    await disconnectKafka();
    await closeRedis();
    await mongoose.connection.close();
    clearTimeout(timer);
    process.exit(0);
  } catch (error) {
    logger.error({ err: error.message }, "shutdown failed");
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason?.message || reason }, "unhandled rejection");
});
process.on("uncaughtException", (error) => {
  logger.error({ err: error.message, stack: error.stack }, "uncaught exception");
  shutdown("uncaughtException");
});

startServer().catch((error) => {
  logger.error({ err: error.message, stack: error.stack }, "server failed to start");
  process.exit(1);
});
