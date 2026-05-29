export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  is_featured: boolean;
  model_url: string | null;
  deleted_at: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}