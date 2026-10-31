const { z } = require("zod");

const notificationSchema = z.object({
  eventId: z.string(),
  type: z.literal("notification.send"),
  occurredAt: z.string(),
  payload: z.object({
    channel: z.enum(["email", "sms", "in-app"]),
    to: z.string().optional(),
    userId: z.string().optional(),
    subject: z.string().optional(),
    text: z.string(),
    template: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional()
  })
});

const paymentEventSchema = z.object({
  eventId: z.string(),
  type: z.string(),
  occurredAt: z.string(),
  payload: z.record(z.string(), z.unknown())
});

const topics = {
  authOtpRequested: "auth.otp.requested",
  notificationSend: "notification.send",
  paymentSucceeded: "payment.succeeded",
  paymentFailed: "payment.failed",
  paymentRefunded: "payment.refunded",
  txnCompleted: "txn.completed",
  txnFailed: "txn.failed",
  upiCollectRequested: "upi.collect.requested",
  upiCollectApproved: "upi.collect.approved"
};

module.exports = { notificationSchema, paymentEventSchema, topics };
