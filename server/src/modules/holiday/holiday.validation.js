import { z } from "zod";

export const listHolidaysSchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const createHolidaySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    date: z.string().min(1, "date is required (YYYY-MM-DD)"),
    isOptional: z.boolean().optional().default(false),
    notes: z.string().max(1000).optional().nullable(),
  }),
});

export const updateHolidaySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    date: z.string().min(1).optional(),
    isOptional: z.boolean().optional(),
    notes: z.string().max(1000).optional().nullable(),
  }),
});

export const holidayIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
