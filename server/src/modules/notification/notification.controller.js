import notificationService from "./notification.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok } from "../../utils/apiResponse.js";

class NotificationController {
  /**
   * GET /api/notifications
   * List current user's notifications.
   */
  listNotifications = catchAsync(async (req, res) => {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.listNotifications({
      userId: req.user.id,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      unreadOnly: unreadOnly === "true",
    });
    return ok(res, "Notifications retrieved", result);
  });

  /**
   * GET /api/notifications/unread-count
   * Get unread count for the header badge.
   */
  getUnreadCount = catchAsync(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user.id);
    return ok(res, "Unread count", { unreadCount: count });
  });

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read.
   */
  markAsRead = catchAsync(async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    return ok(res, "Notification marked as read", notification);
  });

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read.
   */
  markAllAsRead = catchAsync(async (req, res) => {
    const result = await notificationService.markAllAsRead(req.user.id);
    return ok(res, "All notifications marked as read", result);
  });

  /**
   * DELETE /api/notifications/:id
   * Delete a single notification.
   */
  deleteNotification = catchAsync(async (req, res) => {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    return ok(res, "Notification deleted");
  });

  /**
   * DELETE /api/notifications/clear-read
   * Delete all read notifications.
   */
  clearRead = catchAsync(async (req, res) => {
    const result = await notificationService.clearRead(req.user.id);
    return ok(res, "Read notifications cleared", result);
  });

  /**
   * POST /api/notifications/send  (Admin only)
   * Manually send a notification to a user.
   */
  sendNotification = catchAsync(async (req, res) => {
    const notification = await notificationService.send(req.body);
    return ok(res, "Notification sent", notification);
  });
}

export default new NotificationController();
