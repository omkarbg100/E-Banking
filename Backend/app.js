const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");
const mongoose = require("mongoose");

const env = require("./Config/env");
const logger = require("./Infrastructure/logger");
const { getRedis } = require("./Infrastructure/redis");
const { metricsMiddleware, metricsRouter } = require("./Infrastructure/metrics");
const requestId = require("./Middleware/requestId");
const { notFound, errorHandler } = require("./Middleware/errorHandler");

const userRoutes = require("./Routes/userRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const accountRoutes = require("./Routes/accountRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");
const qrRoutes = require("./Routes/qrRoutes");
const developerPaymentRoutes = require("./Routes/developerPaymentRoutes");
const paymentGatewayRoutes = require("./Routes/paymentGatewayRoutes");
const webhookRoutes = require("./Routes/webhookRoutes");
const upiRoutes = require("./Routes/upiRoutes");
const notificationRoutes = require("./Routes/notificationRoutes");

const app = express();

app.disable("x-powered-by");
if (env.TRUST_PROXY) app.set("trust proxy", 1);

app.use(requestId);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    customLogLevel: (req, res, error) => {
      if (error || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    }
  })
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(metricsMiddleware);

app.get("/metrics", metricsRouter());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ebank-backend",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get("/ready", async (req, res) => {
  const checks = {
    mongo: mongoose.connection.readyState === 1,
    redis: false
  };

  try {
    await getRedis().ping();
    checks.redis = true;
  } catch {
    checks.redis = false;
  }

  const ready = Object.values(checks).every(Boolean);
  res.status(ready ? 200 : 503).json({ ready, checks });
});

app.get("/", (req, res) => {
  res.json({ message: "E-Banking API is running", version: "1.0.0" });
});

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/developer", developerPaymentRoutes);
app.use("/api/payment", paymentGatewayRoutes);
app.use("/api/pg", paymentGatewayRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/upi", upiRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
