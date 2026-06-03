export type StockMovementReason =
  | "restock"
  | "sale"
  | "manual_increase"
  | "manual_decrease"
  | "return"
  | "damaged"
  | "initial";

export interface StockMovement {
  id: string;
  tenant_id: string;
  variant_id: string;
  order_id: string | null;
  delta: number;
  reason: StockMovementReason;
  note: string | null;
  actor_id: string | null;
  created_at: string;
}

export interface VariantStock {
  variant_id: string;
  tenant_id: string;
  stock: number;
  last_movement_at: string | null;
}

export interface StockLevel {
  variant_id: string;
  size: string;
  color: string;
  stock: number;
  product_id: string;
}