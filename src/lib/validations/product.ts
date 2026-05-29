import { z } from "zod";
import { commonSchemas } from "./schemas";

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(24),
  category: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Invalid category")
    .optional(),
  sort: z
    .enum(["price_asc", "price_desc", "newest", "featured"])
    .default("newest"),
  search: z.string().max(100).trim().optional(),
  featured: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const productParamsSchema = z.object({
  slug: commonSchemas.slug,
});

export const productIdParamsSchema = z.object({
  id: commonSchemas.uuid,
});

export const createProductSchema = z.object({
  name: commonSchemas.shortText,
  slug: commonSchemas.slug,
  description: commonSchemas.longText,
  price: commonSchemas.price,
  category: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Invalid category format"),
  is_featured: z.boolean().default(false),
  model_url: z
    .string()
    .url()
    .max(2048)
    .refine((url) => url.startsWith("https://"), {
      message: "Model URL must use HTTPS",
    })
    .nullable()
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createVariantSchema = z.object({
  size: z.string().min(1).max(20).trim(),
  color: z.string().min(1).max(50).trim(),
  stock: z.number().int().min(0).max(99999),
});

export const createImageSchema = z.object({
  url: commonSchemas.url,
  alt: z.string().max(255).trim().default(""),
  position: z.number().int().min(0).max(999).default(0),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type CreateImageInput = z.infer<typeof createImageSchema>;