import { z } from "zod";

const statuses = ["ACTIVE", "INACTIVE", "CHURNED"];

export const createClientSchema = z.object({
  body: z.object({
    companyName: z.string().min(1, "Company name is required").max(200),
    contactName: z.string().min(1, "Contact name is required").max(100),
    email: z.string().email("Invalid email").optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    industry: z.string().max(100).optional().nullable(),
    website: z.string().max(200).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    accountManagerId: z.string().optional().nullable(),
  }),
});

export const updateClientSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    companyName: z.string().min(1).max(200).optional(),
    contactName: z.string().min(1).max(100).optional(),
    email: z.string().email("Invalid email").optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    industry: z.string().max(100).optional().nullable(),
    website: z.string().max(200).optional().nullable(),
    logo: z.string().optional().nullable(),
    status: z.enum(statuses).optional(),
    notes: z.string().max(2000).optional().nullable(),
    accountManagerId: z.string().optional().nullable(),
  }),
});

export const listClientsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    status: z.enum(statuses).optional(),
    accountManagerId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z
      .enum(["createdAt", "companyName", "contactName", "status"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getClientSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
