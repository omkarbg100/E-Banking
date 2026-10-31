const { Queue, Worker } = require("bullmq");
const env = require("../Config/env");
const logger = require("./logger");
const { getRedis } = require("./redis");
const { sendMailDirect } = require("./mailer");
const { deliverWebhook } = require("./webhookDelivery");
const { queueJobs } = require("./metrics");
const WebhookDelivery = require("../Models/WebhookDelivery");
const Webhook = require("../Models/Webhook");

const QUEUE_NAMES = {
  EMAIL: "email",
  WEBHOOK: "webhook"
};

const queues = {};
const workers = [];

function createQueues() {
  if (queues.email) return queues;
  const connection = getRedis();
  queues.email = new Queue(QUEUE_NAMES.EMAIL, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 500,
      removeOnFail: 1000
    }
  });
  queues.webhook = new Queue(QUEUE_NAMES.WEBHOOK, {
    connection,
    defaultJobOptions: {
      attempts: env.WEBHOOK_MAX_ATTEMPTS,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 500,
      removeOnFail: 1000
    }
  });
  return queues;
}

async function enqueueEmail({ to, subject, text, html }) {
  try {
    createQueues();
    const job = await queues.email.add("send-email", { to, subject, text, html });
    logger.info({ jobId: job.id, to, subject }, "email queued");
    return job;
  } catch (error) {
    logger.warn({ err: error.message, to }, "email queue unavailable; sending directly");
    return sendMailDirect({ to, subject, text, html });
  }
}

async function enqueueWebhook({ webhook, event, data, eventId }) {
  createQueues();
  const jobId = `${webhook.merchantId}-${eventId}`;
  const job = await queues.webhook.add(
    "deliver-webhook",
    {
      webhookId: webhook._id.toString(),
      merchantId: webhook.merchantId,
      url: webhook.url,
      secret: webhook.secret,
      event,
      data,
      eventId
    },
    { jobId }
  );
  logger.info({ jobId: job.id, event, merchantId: webhook.merchantId }, "webhook queued");
  return job;
}

async function recordDeliveryAttempt(job, result) {
  const { merchantId, eventId } = job.data || {};
  if (!merchantId || !eventId) return;

  const ok = Boolean(result?.ok);
  await WebhookDelivery.updateOne(
    { merchantId, eventId },
    {
      $set: {
        status: ok ? "SUCCESS" : "PENDING",
        responseStatus: result?.status,
        error: ok ? null : `Webhook responded with status ${result?.status}`,
        attempts: job.attemptsMade + 1
      }
    }
  ).catch((error) => logger.warn({ err: error.message, eventId }, "could not update webhook delivery"));

  if (ok) {
    await Webhook.updateOne(
      { merchantId },
      { $set: { failureCount: 0, lastDeliveryAt: new Date() } }
    ).catch(() => {});
  }
}

async function recordDeliveryFailure(job, error) {
  const { merchantId, eventId } = job.data || {};
  if (!merchantId || !eventId) return;

  const finalAttempt = job.attemptsMade >= (job.opts.attempts || 1);
  await WebhookDelivery.updateOne(
    { merchantId, eventId },
    {
      $set: {
        status: finalAttempt ? "FAILED" : "PENDING",
        error: error.message,
        attempts: job.attemptsMade
      }
    }
  ).catch(() => {});

  if (finalAttempt) {
    await Webhook.updateOne({ merchantId }, { $inc: { failureCount: 1 } }).catch(() => {});
  }
}

function startWorkers() {
  const connection = getRedis();

  const emailWorker = new Worker(
    QUEUE_NAMES.EMAIL,
    async (job) => {
      try {
        const result = await sendMailDirect(job.data);
        queueJobs.inc({ queue: QUEUE_NAMES.EMAIL, status: "success" });
        return result;
      } catch (error) {
        queueJobs.inc({ queue: QUEUE_NAMES.EMAIL, status: "error" });
        throw error;
      }
    },
    { connection, concurrency: 5 }
  );

  const webhookWorker = new Worker(
    QUEUE_NAMES.WEBHOOK,
    async (job) => {
      try {
        const result = await deliverWebhook(job.data);
        queueJobs.inc({ queue: QUEUE_NAMES.WEBHOOK, status: result.ok ? "success" : "error" });
        await recordDeliveryAttempt(job, result);
        if (!result.ok) {
          const error = new Error(`Webhook responded with status ${result.status}`);
          error.status = result.status;
          throw error;
        }
        return result;
      } catch (error) {
        queueJobs.inc({ queue: QUEUE_NAMES.WEBHOOK, status: "error" });
        throw error;
      }
    },
    { connection, concurrency: 10 }
  );

  for (const worker of [emailWorker, webhookWorker]) {
    worker.on("failed", (job, error) => {
      logger.warn({ jobId: job?.id, err: error.message }, "queue job failed");
      if (worker === webhookWorker && job) {
        recordDeliveryFailure(job, error).catch(() => {});
      }
    });
    worker.on("error", (error) => {
      logger.warn({ err: error.message }, "queue worker error");
    });
    workers.push(worker);
  }

  logger.info("queue workers started");
  return workers;
}

async function closeQueues() {
  await Promise.all(workers.map((worker) => worker.close().catch(() => {})));
  await Promise.all(Object.values(queues).map((queue) => queue.close().catch(() => {})));
}

module.exports = {
  QUEUE_NAMES,
  createQueues,
  enqueueEmail,
  enqueueWebhook,
  startWorkers,
  closeQueues
};
