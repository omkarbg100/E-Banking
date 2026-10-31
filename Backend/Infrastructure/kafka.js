const { Kafka, logLevel } = require("kafkajs");
const env = require("../Config/env");
const logger = require("./logger");
const { kafkaPublished } = require("./metrics");

const TOPICS = {
  OTP_REQUESTED: "auth.otp.requested",
  USER_REGISTERED: "user.registered",
  TXN_COMPLETED: "txn.completed",
  TXN_FAILED: "txn.failed",
  PAYMENT_SUCCEEDED: "payment.succeeded",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",
  WEBHOOK_DELIVER: "webhook.deliver",
  ADMIN_ACTION: "admin.action",
  NOTIFICATION_SEND: "notification.send"
};

const ALL_TOPICS = Object.values(TOPICS);

let producer = null;
let producerReady = false;
let consumer = null;
let consumerReady = false;

function isConsumerReady() {
  return consumerReady;
}

function createKafka() {
  return new Kafka({
    clientId: env.KAFKA_CLIENT_ID,
    brokers: env.KAFKA_BROKERS,
    logLevel: logLevel.ERROR,
    retry: { retries: 5, initialRetryTime: 300 }
  });
}

async function connectProducer() {
  if (!env.KAFKA_READY) {
    logger.warn("kafka disabled; domain events will use in-process fallback");
    return null;
  }
  if (producer) return producer;

  producer = createKafka().producer({ allowAutoTopicCreation: true });
  try {
    await producer.connect();
    producerReady = true;
    logger.info("kafka producer connected");
  } catch (error) {
    producerReady = false;
    logger.warn({ err: error.message }, "kafka producer unavailable; using local fallback");
  }
  return producer;
}

async function publish(topic, payload, key) {
  if (!producerReady || !producer) return false;
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: key ? String(key) : undefined,
          value: JSON.stringify({ ...payload, _topic: topic, _publishedAt: new Date().toISOString() })
        }
      ]
    });
    kafkaPublished.inc({ topic, status: "success" });
    return true;
  } catch (error) {
    kafkaPublished.inc({ topic, status: "error" });
    logger.warn({ err: error.message, topic }, "kafka publish failed");
    return false;
  }
}

async function startConsumer(handler) {
  if (!env.KAFKA_READY) return null;
  if (consumer) return consumer;

  consumer = createKafka().consumer({ groupId: env.KAFKA_GROUP_ID });
  try {
    await consumer.connect();
    await consumer.subscribe({ topics: ALL_TOPICS, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        let payload;
        try {
          payload = JSON.parse(message.value.toString());
        } catch {
          payload = { raw: message.value.toString() };
        }
        try {
          await handler(topic, payload);
        } catch (error) {
          logger.error({ err: error.message, topic, partition }, "kafka handler failed");
        }
      }
    });
    consumerReady = true;
    logger.info({ topics: ALL_TOPICS.length }, "kafka consumer started");
    return consumer;
  } catch (error) {
    consumerReady = false;
    logger.warn({ err: error.message }, "kafka consumer unavailable; in-process fallback remains active");
    consumer = null;
    return null;
  }
}

async function disconnectKafka() {
  if (consumer) {
    try {
      await consumer.disconnect();
    } catch {}
    consumer = null;
    consumerReady = false;
  }
  if (producer) {
    try {
      await producer.disconnect();
    } catch {}
    producer = null;
    producerReady = false;
  }
}

module.exports = {
  TOPICS,
  connectProducer,
  publish,
  startConsumer,
  isConsumerReady,
  disconnectKafka
};
