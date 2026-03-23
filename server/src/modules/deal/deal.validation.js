import { z } from "zod";

const stages = ["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

export const createDealSchema = z.object({
  body: z.object({
    leadId: z.string().min(1, "Lead ID is required"),
    title: z.string().min(1, "Title is required").max(200),
    value: z.coerce.number().min(0).optional().nullable(),
    expectedCloseAt: z.coerce.date().optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    assigneeId: z.string().optional().nullable(),
  }),
});

export const updateDealSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    value: z.coerce.number().min(0).optional().nullable(),
    expectedCloseAt: z.coerce.date().optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    assigneeId: z.string().optional().nullable(),
  }),
});

export const updateDealStageSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    stage: z.enum(stages, { required_error: "Stage is required" }),
    lostReason: z.string().max(500).optional().nullable(),
    // Fields for WON conversion
    accountManagerId: z.string().optional().nullable(),
  }),
});

export const listDealsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    stage: z.enum(stages).optional(),
    assigneeId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z
      .enum(["createdAt", "title", "value", "stage", "expectedCloseAt"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getDealSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
