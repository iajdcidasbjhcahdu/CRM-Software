import { z } from "zod";

export const createPromptSchema = z.object({
  body: z.object({
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
    name: z.string().min(1).max(255),
    description: z.string().max(500).nullable().optional(),
    prompt: z.string().min(1),
    responseSchema: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updatePromptSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes")
      .optional(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(500).nullable().optional(),
    prompt: z.string().min(1).optional(),
    responseSchema: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const promptIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
