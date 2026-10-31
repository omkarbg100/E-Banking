const Notification = require("../Models/Notification");
const asyncHandler = require("../Middleware/asyncHandler");
const httpError = require("../Utils/httpError");

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const unread = await Notification.countDocuments({ userId: req.user.id, isRead: false });
  res.json({ notifications, unread });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!notification) throw httpError(404, "Notification not found");
  res.json({ success: true, notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, isRead: false }, { $set: { isRead: true } });
  res.json({ success: true });
});

module.exports = { listNotifications, markRead, markAllRead };
