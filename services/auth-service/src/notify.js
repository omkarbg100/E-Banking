const { randomUUID } = require("crypto");
const { publishEvent, callService, TOPICS } = require("@ebank/common");
const state = require("./state");

async function sendNotification(payload) {
  const event = {
    eventId: randomUUID(),
    type: "notification.send",
    occurredAt: new Date().toISOString(),
    payload
  };
  if (state.producer) {
    try {
      await publishEvent(
        state.producer,
        TOPICS.NOTIFICATION_SEND,
        payload.userId || payload.to,
        event
      );
      return;
    } catch (err) {
      if (state.logger) state.logger.warn({ err: err.message }, "kafka notification fallback");
    }
  }
  await callService("notification", "/internal/send", { method: "POST", body: payload });
}

async function publishDomain(topic, key, type, payload) {
  const event = {
    eventId: randomUUID(),
    type,
    occurredAt: new Date().toISOString(),
    payload
  };
  if (!state.producer) return;
  try {
    await publishEvent(state.producer, topic, key, event);
  } catch (err) {
    if (state.logger) state.logger.warn({ err: err.message, topic }, "domain event failed");
  }
}

module.exports = { sendNotification, publishDomain };
