const Notification = require("../Models/Notification");

const notifyUser = async ({ userId, title, message, type = "INFO" }) => {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type,
    });
  } catch (error) {
    console.error("Notification failed:", error.message);
  }
};

module.exports = notifyUser;
