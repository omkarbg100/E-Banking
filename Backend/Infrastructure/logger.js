const pino = require("pino");
const env = require("../Config/env");

const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "ebank-backend", env: env.NODE_ENV },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.oldPassword",
      "req.body.newPassword",
      "req.body.otp",
      "res.headers['set-cookie']",
      "*.password",
      "*.secretKey",
      "*.otp"
    ],
    censor: "[REDACTED]"
  }
});

module.exports = logger;
