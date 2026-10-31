const crypto = require("crypto");
const { EventEmitter } = require("events");
const { publish, isConsumerReady } = require("./kafka");
const logger = require("./logger");

const bus = new EventEmitter();
bus.setMaxListeners(0);

async function emitEvent(topic, payload, key) {
  const event = { ...payload, _eventId: payload._eventId || crypto.randomUUID() };
  const delivered = await publish(topic, event, key);
  if (!delivered || !isConsumerReady()) {
    setImmediate(() => bus.emit(topic, event));
  }
  return delivered;
}

function onEvent(topic, handler) {
  bus.on(topic, (payload) => {
    Promise.resolve(handler(payload)).catch((error) => {
      logger.error({ err: error.message, topic }, "local event handler failed");
    });
  });
}

module.exports = { emitEvent, onEvent, bus };
