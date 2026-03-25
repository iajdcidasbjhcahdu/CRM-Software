import { z } from "zod";

export const updateEmailTemplateSchema = z.object({
  body: z.object({
    subject: z.string().min(1).max(500).optional(),
    body: z.string().optional(),
  }),
});

export const getEmailTemplateSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Template ID is required"),
  }),
});
