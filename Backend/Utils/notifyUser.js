const Notification = require("../Models/Notification");
const logger = require("../Infrastructure/logger");

const notifyUser = async ({ userId, title, message, type = "INFO", metadata }) => {
  try {
    return await Notification.create({ userId, title, message, type, metadata });
  } catch (error) {
    logger.error({ err: error.message, userId }, "notification failed");
    return null;
  }
};

module.exports = notifyUser;
