const { ApiError } = require("./errors");

const defaults = {
  auth: process.env.AUTH_URL || "http://localhost:5001",
  banking: process.env.BANKING_URL || "http://localhost:5002",
  payment: process.env.PAYMENT_URL || "http://localhost:5003",
  upi: process.env.UPI_URL || "http://localhost:5004",
  notification: process.env.NOTIFICATION_URL || "http://localhost:5005",
  webhook: process.env.WEBHOOK_URL || "http://localhost:5006",
  admin: process.env.ADMIN_URL || "http://localhost:5007"
};

function baseUrl(service) {
  if (/^https?:\/\//.test(service)) return service;
  return defaults[service] || service;
}

async function callService(service, path, { method = "GET", body, timeoutMs = 5000, retries = 2 } = {}) {
  const url = `${baseUrl(service).replace(/\/$/, "")}${path}`;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "content-type": "application/json",
          "x-service-token": process.env.INTERNAL_SERVICE_TOKEN || "dev-internal-token"
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs)
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new ApiError(response.status, data.message || `Service ${service} failed`, data.details);
      }
      return data;
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError && err.status < 500) throw err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }
  throw lastError instanceof ApiError
    ? lastError
    : new ApiError(502, `Service ${service} unavailable: ${lastError.message}`);
}

module.exports = { callService, baseUrl };
