import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import notificationController from "./notification.controller.js";
import {
  listNotificationsSchema,
  notificationIdSchema,
  sendNotificationSchema,
} from "./notification.validation.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ── User-facing routes (any authenticated user) ──

router.get(
  "/",
  validate(listNotificationsSchema),
  notificationController.listNotifications
);

router.get("/unread-count", notificationController.getUnreadCount);

router.patch("/read-all", notificationController.markAllAsRead);

router.delete("/clear-read", notificationController.clearRead);

router.patch(
  "/:id/read",
  validate(notificationIdSchema),
  notificationController.markAsRead
);

router.delete(
  "/:id",
  validate(notificationIdSchema),
  notificationController.deleteNotification
);

// ── Admin route — manually send a notification ──

router.post(
  "/send",
  authorize("OWNER", "ADMIN"),
  validate(sendNotificationSchema),
  notificationController.sendNotification
);

export default router;
