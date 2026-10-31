const mongoose = require("mongoose");

async function connectMongo(uri, service, attempts = 60, delayMs = 1000) {
  if (!uri) throw new Error("MongoDB URI is required");
  mongoose.set("strictQuery", true);
  for (let i = 0; i < attempts; i += 1) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 20
      });
      if (service) console.log(`[${service}] mongodb connected`);
      return mongoose.connection;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function disconnectMongo() {
  await mongoose.disconnect();
}

module.exports = { connectMongo, disconnectMongo, mongoose };
