const crypto = require("crypto");
const dns = require("dns").promises;
const net = require("net");
const env = require("../Config/env");
const logger = require("./logger");

function isPrivateAddress(address) {
  if (!net.isIP(address)) return false;
  if (address === "::1" || address === "0.0.0.0") return true;
  if (address.startsWith("127.") || address.startsWith("10.") || address.startsWith("192.168.")) return true;
  if (address.startsWith("169.254.")) return true;
  const parts = address.split(".").map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true;
  return false;
}

async function assertSafeUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid webhook URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Webhook URL must use http or https");
  }

  if (env.WEBHOOK_ALLOW_PRIVATE) return url;

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("Webhook URL cannot target localhost");
  }

  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("Webhook URL cannot target a private address");
    return url;
  }

  const records = await dns.lookup(hostname, { all: true });
  if (records.some((record) => isPrivateAddress(record.address))) {
    throw new Error("Webhook URL resolves to a private address");
  }

  return url;
}

function signPayload(secret, timestamp, body) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

async function deliverWebhook({ url, secret, event, data, eventId }) {
  const safeUrl = await assertSafeUrl(url);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify({
    event,
    data,
    eventId,
    timestamp: new Date().toISOString()
  });
  const signature = signPayload(secret, timestamp, body);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(safeUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "E-Banking-Webhooks/1.0",
        "x-ebank-event": event,
        "x-ebank-event-id": eventId,
        "x-ebank-timestamp": timestamp,
        "x-ebank-signature": `sha256=${signature}`
      },
      body,
      signal: controller.signal,
      redirect: "manual"
    });

    logger.info({ eventId, event, status: response.status }, "webhook delivered");
    return { status: response.status, ok: response.ok };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { deliverWebhook, signPayload, assertSafeUrl, isPrivateAddress };
