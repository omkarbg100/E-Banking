const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const outboxSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    topic: { type: String, required: true },
    type: { type: String, required: true },
    key: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    publishedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    lastError: { type: String }
  },
  { timestamps: true }
);

outboxSchema.index({ publishedAt: 1, createdAt: 1 });

function getOutboxModel(connection) {
  return connection.models.OutboxEvent || connection.model("OutboxEvent", outboxSchema);
}

async function writeOutbox(Model, { topic, type, key, payload }, { session } = {}) {
  const docs = await Model.create(
    [
      {
        eventId: randomUUID(),
        topic,
        type,
        key,
        payload
      }
    ],
    session ? { session } : undefined
  );
  return docs[0];
}

function startOutboxPublisher({ Model, producer, publish, logger, intervalMs = 1500 }) {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const docs = await Model.find({ publishedAt: null }).sort({ createdAt: 1 }).limit(50);
      for (const doc of docs) {
        try {
          const event = {
            eventId: doc.eventId,
            type: doc.type,
            occurredAt: doc.createdAt.toISOString(),
            payload: doc.payload
          };
          if (publish) {
            await publish(doc.topic, doc.key, event);
          } else if (producer) {
            await producer.send({
              topic: doc.topic,
              messages: [
                {
                  key: doc.key ? String(doc.key) : undefined,
                  value: JSON.stringify(event)
                }
              ]
            });
          }
          doc.publishedAt = new Date();
          doc.lastError = undefined;
          await doc.save();
        } catch (err) {
          doc.attempts += 1;
          doc.lastError = err.message;
          await doc.save();
          if (logger) logger.error({ err: err.message, eventId: doc.eventId }, "outbox publish failed");
          break;
        }
      }
    } catch (err) {
      if (logger) logger.error({ err: err.message }, "outbox poll failed");
    } finally {
      running = false;
    }
  }, intervalMs);
  timer.unref();
  return timer;
}

module.exports = { outboxSchema, getOutboxModel, writeOutbox, startOutboxPublisher };
