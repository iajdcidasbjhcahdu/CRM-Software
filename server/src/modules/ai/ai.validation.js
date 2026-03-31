import { z } from "zod";

export const generateSchema = z.object({
  body: z.object({
    systemPromptSlug: z.string().min(1, "System prompt slug is required"),
    userPrompt: z.string().min(1, "User prompt is required"),
    context: z.record(z.any()).optional(),
    structured: z.boolean().optional(),
  }),
});

export const searchSchema = z.object({
  body: z.object({
    question: z.string().min(1, "Question is required").max(1000),
  }),
});
