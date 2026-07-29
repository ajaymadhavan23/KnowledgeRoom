import { Notification } from "../models/Notification.js";

export async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("fromUser", "name department avatarUrl")
      .populate("post", "title")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    // Since notifications are deleted on read, all remaining ones are unread
    const count = await Notification.countDocuments({ recipient: req.user._id });
    res.json({ count });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req, res, next) {
  try {
    // Delete all notifications for this user — they've been read
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    // Delete the notification permanently once it's been read
    const result = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    if (!result) return res.status(404).json({ message: "Notification not found" });
    res.json({ deleted: true, _id: req.params.id });
  } catch (error) {
    next(error);
  }
}
