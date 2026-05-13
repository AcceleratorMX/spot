import { z } from "zod";

export const boardSchema = z.object({
  title: z.string().min(1, "Title is required").max(50, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
});

export type BoardSchema = z.infer<typeof boardSchema>;
