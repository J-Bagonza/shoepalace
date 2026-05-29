import { z } from "zod";
import { commonSchemas } from "./schemas";

export const addCartItemSchema = z
  .object({
    variant_id: commonSchemas.uuid,
    quantity: z.number().int().min(1).max(99),
  })
  .strip();

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().min(1).max(99),
  })
  .strip();

export const cartItemParamsSchema = z
  .object({
    id: commonSchemas.uuid,
  })
  .strip();

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;