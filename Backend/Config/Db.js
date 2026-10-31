const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../Infrastructure/logger");

async function connectDB() {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.MONGO_URI, {
      dbName: env.MONGO_DB_NAME,
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    logger.info("mongodb connected");
  } catch (error) {
    logger.error({ err: error.message }, "mongodb connection failed");
    throw error;
  }
}

module.exports = connectDB;
