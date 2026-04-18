import { z } from "zod";

const attendanceStatuses = [
  "PRESENT", "ABSENT", "HALF_DAY_FIRST", "HALF_DAY_SECOND",
  "ON_LEAVE", "HOLIDAY", "WEEKEND", "WORK_FROM_HOME", "ON_DUTY",
];

export const checkInSchema = z.object({
  body: z.object({
    notes: z.string().max(500).optional().nullable(),
  }).optional().default({}),
});

export const checkOutSchema = z.object({
  body: z.object({
    notes: z.string().max(500).optional().nullable(),
  }).optional().default({}),
});

export const listMyAttendanceSchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export const dailySheetSchema = z.object({
  query: z.object({
    date: z.string().min(1, "date is required"),
  }),
});

export const userAttendanceSchema = z.object({
  params: z.object({ userId: z.string().min(1) }),
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export const manualMarkSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    date: z.string().min(1, "date is required (YYYY-MM-DD)"),
    status: z.enum(attendanceStatuses),
    checkInAt: z.string().optional().nullable(),
    checkOutAt: z.string().optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  }),
});

export const updateAttendanceSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum(attendanceStatuses).optional(),
    checkInAt: z.string().optional().nullable(),
    checkOutAt: z.string().optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  }),
});

export const deleteAttendanceSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
