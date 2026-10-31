const { Kafka, logLevel } = require("kafkajs");

function createKafka(clientId, brokers) {
  return new Kafka({
    clientId,
    brokers: (brokers || "localhost:19092").split(","),
    logLevel: logLevel.ERROR,
    retry: { initialRetryTime: 300, retries: 10 }
  });
}

async function createProducer(kafka, logger) {
  const producer = kafka.producer();
  for (let i = 0; i < 60; i += 1) {
    try {
      await producer.connect();
      return producer;
    } catch (err) {
      if (i === 59) throw err;
      if (logger) logger.warn({ err: err.message }, "kafka producer retry");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function publishEvent(producer, topic, key, payload) {
  await producer.send({
    topic,
    messages: [{ key: key ? String(key) : undefined, value: JSON.stringify(payload) }]
  });
}

async function startConsumer({ kafka, groupId, topics, handler, logger }) {
  const consumer = kafka.consumer({ groupId });
  for (let i = 0; i < 60; i += 1) {
    try {
      await consumer.connect();
      break;
    } catch (err) {
      if (i === 59) throw err;
      if (logger) logger.warn({ err: err.message }, "kafka consumer retry");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      let event;
      try {
        event = JSON.parse(message.value.toString());
      } catch (err) {
        if (logger) logger.error({ err: err.message, topic }, "invalid kafka message");
        return;
      }
      try {
        await handler({ topic, partition, event });
      } catch (err) {
        if (logger) logger.error({ err, topic, eventId: event.eventId }, "kafka handler failed");
        throw err;
      }
    }
  });
  return consumer;
}

function idempotentHandler({ redis, groupId, handler, logger }) {
  return async ({ topic, event, partition }) => {
    const eventId = event.eventId;
    if (!eventId) return handler({ topic, event, partition });
    const key = `event:processed:${groupId}:${eventId}`;
    const existing = await redis.set(key, "1", "EX", 60 * 60 * 24 * 7, "NX");
    if (existing === null) {
      if (logger) logger.debug({ eventId, topic }, "duplicate event ignored");
      return undefined;
    }
    return handler({ topic, event, partition });
  };
}

module.exports = {
  createKafka,
  createProducer,
  publishEvent,
  startConsumer,
  idempotentHandler
};
