import { Router } from "express";
import { getNotifications, getUnreadCount, markAllRead, markNotificationRead } from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/mark-all-read", markAllRead);
router.patch("/:id/read", markNotificationRead);

export default router;
