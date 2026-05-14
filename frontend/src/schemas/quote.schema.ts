import { z } from "zod";

export const CreateQuoteSchema = z.object({
  text: z
    .string()
    .min(1, "Quote text is required")
    .max(500, "Quote text is too long")
    .trim(),
});

export const DeleteQuoteSchema = z.object({
  id: z.number().int().positive(),
});
