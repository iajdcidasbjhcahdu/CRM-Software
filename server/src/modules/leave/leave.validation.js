import { z } from "zod";

const statuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];
const dayTypes = ["FULL_DAY", "FIRST_HALF", "SECOND_HALF"];

// ── Leave Types ──
export const createLeaveTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    code: z.string().min(1).max(30),
    isPaid: z.boolean().optional().default(true),
    defaultQuota: z.number().min(0).optional().nullable(),
    color: z.string().max(30).optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateLeaveTypeSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    code: z.string().min(1).max(30).optional(),
    isPaid: z.boolean().optional(),
    defaultQuota: z.number().min(0).optional().nullable(),
    color: z.string().max(30).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const leaveTypeIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

// ── Leave Balances ──
export const myBalancesSchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const userBalancesSchema = z.object({
  params: z.object({ userId: z.string().min(1) }),
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const updateBalanceSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    allocated: z.number().min(0).optional(),
    used: z.number().min(0).optional(),
  }),
});

export const seedBalancesSchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100),
  }),
});

// ── Leave Requests ──
export const createRequestSchema = z.object({
  body: z.object({
    leaveTypeId: z.string().min(1),
    fromDate: z.string().min(1),
    toDate: z.string().min(1),
    fromDayType: z.enum(dayTypes).optional().default("FULL_DAY"),
    toDayType: z.enum(dayTypes).optional().default("FULL_DAY"),
    reason: z.string().min(1).max(2000),
  }),
});

export const listRequestsSchema = z.object({
  query: z.object({
    status: z.enum(statuses).optional(),
    userId: z.string().optional(),
    year: z.coerce.number().int().optional(),
  }),
});

export const requestIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const reviewRequestSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    reviewNotes: z.string().max(2000).optional().nullable(),
  }),
});
