import { z } from "zod";

const statuses = ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Project name is required").max(200),
    description: z.string().max(2000).optional().nullable(),
    clientId: z.string().min(1, "Client ID is required"),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    budget: z.coerce.number().min(0).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    accountManagerId: z.string().optional().nullable(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    status: z.enum(statuses).optional(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    budget: z.coerce.number().min(0).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    accountManagerId: z.string().optional().nullable(),
  }),
});

export const listProjectsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    status: z.enum(statuses).optional(),
    clientId: z.string().optional(),
    accountManagerId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z
      .enum(["createdAt", "name", "status", "startDate", "endDate", "budget"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getProjectSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
