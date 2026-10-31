const TOPICS = {
  AUTH_OTP_REQUESTED: "auth.otp.requested",
  AUTH_LOGIN_SUCCEEDED: "auth.login.succeeded",
  USER_REGISTERED: "user.registered",
  USER_PASSWORD_RESET: "user.password.reset",
  TXN_INITIATED: "txn.initiated",
  TXN_COMPLETED: "txn.completed",
  TXN_FAILED: "txn.failed",
  TXN_REVERSED: "txn.reversed",
  PAYMENT_ORDER_CREATED: "payment.order.created",
  PAYMENT_SUCCEEDED: "payment.succeeded",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",
  UPI_COLLECT_REQUESTED: "upi.collect.requested",
  UPI_COLLECT_APPROVED: "upi.collect.approved",
  NOTIFICATION_SEND: "notification.send",
  WEBHOOK_DELIVER: "webhook.deliver",
  FRAUD_ALERT: "fraud.alert",
  AUDIT_LOG: "audit.log"
};

module.exports = { TOPICS };
