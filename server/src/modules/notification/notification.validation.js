import { z } from "zod";

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    unreadOnly: z.enum(["true", "false"]).optional(),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Notification ID is required"),
  }),
});

export const sendNotificationSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
    title: z.string().min(1, "Title is required").max(255),
    description: z.string().min(1, "Description is required"),
    type: z
      .enum([
        "INFO", "SUCCESS", "WARNING", "ERROR",
        "LEAD", "DEAL", "CLIENT", "PROJECT",
        "TEAM", "SERVICE", "USER", "SYSTEM",
      ])
      .optional()
      .default("INFO"),
    channel: z.enum(["IN_APP", "EMAIL", "BOTH"]).optional().default("IN_APP"),
    linkUrl: z.string().optional().nullable(),
  }),
});
