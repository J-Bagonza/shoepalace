import { z } from "zod";

export const commonSchemas = {
  uuid: z.string().uuid("Invalid ID format"),

  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),

  email: z.string().email("Invalid email").max(254),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),

  pagination: z.object({
    page: z.coerce.number().int().min(1).max(1000).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(24),
  }),

  price: z.number().positive().multipleOf(0.01).max(99999.99),

  shortText: z.string().min(1).max(255).trim(),

  longText: z.string().min(1).max(5000).trim(),

  url: z.string().url().max(2048),
} as const;