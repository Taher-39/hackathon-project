const Notification = require("../models/Notification");
const { ok } = require("../utils/apiResponse");

exports.listNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);
  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
  return ok(res, { notifications, unreadCount });
};

exports.markRead = async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, userId: req.user._id }, { read: true });
  return ok(res, null, "Marked as read");
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  return ok(res, null, "All marked as read");
};
