import { z } from "zod";
import { commonSchemas } from "./schemas";

export const createOrderSchema = z.object({
  customer_email: commonSchemas.email,
  customer_name: z
    .string()
    .min(2, "Name is required")
    .max(255)
    .trim(),
  customer_phone: z
    .string()
    .max(30)
    .trim()
    .optional(),
  shipping_address: z
    .string()
    .min(5, "Shipping address is required")
    .max(500)
    .trim(),
  notes: z.string().max(1000).trim().optional(),
  payment_method: z.enum(["mpesa", "card", "cash"]),
  items: z
    .array(
      z.object({
        variant_id: commonSchemas.uuid,
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Order must have at least one item")
    .max(50),
});

export const orderIdSchema = z.object({
  id: commonSchemas.uuid,
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  note: z.string().max(500).trim().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;