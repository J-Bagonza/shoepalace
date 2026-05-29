import { z } from "zod";

export const adminProductFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers and hyphens only",
    ),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description too long"),
  price: z
  .number()
  .positive("Price must be positive")
  .multipleOf(0.01, "Max 2 decimal places")
  .max(99999.99, "Price too high"),
  category: z
    .string()
    .min(1, "Category is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  is_featured: z.boolean().default(false),
  model_url: z
    .string()
    .url("Must be a valid URL")
    .max(2048)
    .nullable()
    .optional(),
});

export type AdminProductFormValues = z.infer<typeof adminProductFormSchema>;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}