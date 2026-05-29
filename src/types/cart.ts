export interface CartItem {
  id: string;
  variant_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  image_url: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}