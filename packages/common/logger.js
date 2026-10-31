const pino = require("pino");

function createLogger(service, level = process.env.LOG_LEVEL || "info") {
  return pino({
    level,
    base: { service },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "password",
        "otp",
        "secret",
        "secretKey",
        "refreshToken"
      ],
      censor: "[redacted]"
    }
  });
}

module.exports = { createLogger };
