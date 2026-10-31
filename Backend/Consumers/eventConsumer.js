const { onEvent } = require("../Infrastructure/events");
const { startConsumer, TOPICS } = require("../Infrastructure/kafka");
const { getRedis, cacheKey } = require("../Infrastructure/redis");
const { enqueueEmail } = require("../Infrastructure/queue");
const notifyUser = require("../Utils/notifyUser");
const User = require("../Models/User");
const logger = require("../Infrastructure/logger");

async function claimEvent(topic, eventId) {
  if (!eventId) return true;
  const key = cacheKey("event", topic, eventId);
  const claimed = await getRedis().set(key, "1", "EX", 86400, "NX");
  return claimed === "OK";
}

function money(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

async function handleEvent(topic, payload) {
  if (!(await claimEvent(topic, payload._eventId))) return;

  switch (topic) {
    case TOPICS.USER_REGISTERED: {
      await notifyUser({
        userId: payload.userId,
        title: "Welcome to E-Banking",
        message: `Hi ${payload.name}, your account is ready. Create a bank account to get started.`,
        metadata: payload
      });
      if (payload.email) {
        await enqueueEmail({
          to: payload.email,
          subject: "Welcome to E-Banking",
          text: `Hi ${payload.name}, welcome to E-Banking. Your account is ready.`,
          html: `<h2>Welcome, ${payload.name}!</h2><p>Your E-Banking account is ready. Create a bank account to get started.</p>`
        });
      }
      break;
    }

    case TOPICS.TXN_COMPLETED: {
      if (payload.event === "account.created") break;
      const { amount, type, senderUserId, receiverUserId, fromAccount, toAccount } = payload;

      if (senderUserId) {
        const title = type === "ADMIN_ADJUST" ? "Account debited by admin" : "Money sent";
        await notifyUser({
          userId: senderUserId,
          title,
          message: `${money(amount)} sent from ${fromAccount}${toAccount ? ` to ${toAccount}` : ""}.`,
          metadata: payload
        });
      }

      if (receiverUserId) {
        const title = type === "ADMIN_ADJUST" ? "Account credited by admin" : "Money received";
        await notifyUser({
          userId: receiverUserId,
          title,
          message: `${money(amount)} received${fromAccount ? ` from ${fromAccount}` : ""} in ${toAccount}.`,
          metadata: payload
        });
      }
      break;
    }

    case TOPICS.PAYMENT_SUCCEEDED: {
      await notifyUser({
        userId: payload.customerUserId,
        title: "Payment successful",
        message: `Your payment of ${money(payload.amount)} for order ${payload.orderId} was successful.`,
        metadata: payload
      });
      if (payload.merchantUserId) {
        await notifyUser({
          userId: payload.merchantUserId,
          title: "Payment received",
          message: `You received ${money(payload.amount)} for order ${payload.orderId}.`,
          metadata: payload
        });
      }

      const customer = await User.findById(payload.customerUserId).select("email name");
      if (customer?.email) {
        await enqueueEmail({
          to: customer.email,
          subject: `Payment receipt: ${payload.orderId}`,
          text: `Hi ${customer.name}, your payment of ${money(payload.amount)} for order ${payload.orderId} was successful.`,
          html: `<h2>Payment receipt</h2><p>Order: ${payload.orderId}</p><p>Amount: ${money(payload.amount)}</p><p>Transaction: ${payload.transactionId}</p>`
        });
      }
      break;
    }

    case TOPICS.PAYMENT_REFUNDED: {
      await notifyUser({
        userId: payload.customerUserId,
        title: "Refund processed",
        message: `Your refund of ${money(payload.amount)} for order ${payload.orderId} has been processed.`,
        metadata: payload
      });
      break;
    }

    case TOPICS.PAYMENT_FAILED:
    case TOPICS.TXN_FAILED: {
      if (payload.customerUserId || payload.senderUserId) {
        await notifyUser({
          userId: payload.customerUserId || payload.senderUserId,
          title: "Transaction failed",
          message: payload.reason || "Your transaction could not be completed.",
          type: "ALERT",
          metadata: payload
        });
      }
      break;
    }

    case TOPICS.ADMIN_ACTION: {
      logger.info({ action: payload.action, adminId: payload.adminId }, "admin action recorded");
      break;
    }

    default:
      logger.debug({ topic }, "unhandled event");
  }
}

async function startEventConsumer() {
  for (const topic of Object.values(TOPICS)) {
    onEvent(topic, (payload) => handleEvent(topic, payload));
  }

  await startConsumer(handleEvent).catch((error) => {
    logger.warn({ err: error.message }, "kafka consumer did not start; local event handling remains active");
  });

  logger.info("event consumer ready");
}

module.exports = { startEventConsumer, handleEvent };
