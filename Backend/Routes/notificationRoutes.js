const express = require("express");
const router = express.Router();
const auth = require("../Middleware/authMiddleware");
const { listNotifications, markRead, markAllRead } = require("../Controllers/notificationController");

router.get("/", auth, listNotifications);
router.patch("/read-all", auth, markAllRead);
router.patch("/:id/read", auth, markRead);

module.exports = router;
