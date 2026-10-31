const crypto = require("crypto");
const Webhook = require("../Models/Webhook");
const WebhookDelivery = require("../Models/WebhookDelivery");
const DeveloperAccount = require("../Models/DeveloperAccount");
const asyncHandler = require("../Middleware/asyncHandler");
const httpError = require("../Utils/httpError");
const { enqueueWebhook } = require("../Infrastructure/queue");
const { assertSafeUrl } = require("../Infrastructure/webhookDelivery");

async function fireWebhook(merchantId, event, data) {
  const webhook = await Webhook.findOne({ merchantId, isActive: true });
  if (!webhook) return null;

  const eventId = crypto.randomUUID();
  const delivery = await WebhookDelivery.findOneAndUpdate(
    { merchantId, eventId },
    {
      $setOnInsert: {
        webhookId: webhook._id,
        merchantId,
        event,
        eventId,
        status: "PENDING"
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await enqueueWebhook({
      webhook,
      event,
      data,
      eventId: delivery.eventId
    });
  } catch (error) {
    await WebhookDelivery.updateOne(
      { _id: delivery._id },
      { $set: { status: "FAILED", error: error.message } }
    );
    throw error;
  }

  webhook.lastDeliveryAt = new Date();
  await webhook.save({ validateModifiedOnly: true });
  return delivery;
}

const registerWebhook = asyncHandler(async (req, res) => {
  const { url, secret } = req.body;

  const devAccount = await DeveloperAccount.findOne({ userId: req.user.id });
  if (!devAccount) throw httpError(404, "Developer account not found");

  await assertSafeUrl(url);

  let webhook = await Webhook.findOne({ merchantId: devAccount.merchantId });
  if (webhook) {
    webhook.url = url;
    webhook.secret = secret;
    webhook.isActive = true;
    webhook.failureCount = 0;
    await webhook.save();
  } else {
    webhook = await Webhook.create({
      merchantId: devAccount.merchantId,
      url,
      secret
    });
  }

  res.json({ success: true, webhook });
});

const getWebhook = asyncHandler(async (req, res) => {
  const devAccount = await DeveloperAccount.findOne({ userId: req.user.id });
  if (!devAccount) throw httpError(404, "Developer account not found");

  const webhook = await Webhook.findOne({ merchantId: devAccount.merchantId });
  res.json({ success: true, webhook });
});

const getDeliveries = asyncHandler(async (req, res) => {
  const devAccount = await DeveloperAccount.findOne({ userId: req.user.id });
  if (!devAccount) throw httpError(404, "Developer account not found");

  const deliveries = await WebhookDelivery.find({ merchantId: devAccount.merchantId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json({ success: true, deliveries });
});

module.exports = {
  fireWebhook,
  registerWebhook,
  getWebhook,
  getDeliveries
};
