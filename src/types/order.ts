export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type PaymentMethod = "mpesa" | "card" | "cash";

export interface OrderItem {
  id: string;
  order_id: string;
  tenant_id: string;
  variant_id: string | null;
  product_name: string;
  product_slug: string;
  variant_size: string;
  variant_color: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  tenant_id: string;
  status: string;
  note: string | null;
  actor_id: string | null;
  actor_type: "system" | "admin" | "customer";
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  status: OrderStatus;
  total: number;
  subtotal: number;
  shipping_fee: number;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  payment_method: PaymentMethod | null;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  events?: OrderEvent[];
}

export interface CreateOrderInput {
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address: string;
  notes?: string;
  payment_method: PaymentMethod;
  items: {
    variant_id: string;
    quantity: number;
  }[];
}