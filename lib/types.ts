export interface Product {
  id: string;
  name: string;
  image_url: string | null;
  price: number | null;
  platform: string | null;
  original_url: string;
  category: string | null;
  is_featured: boolean;
  is_sponsored: boolean;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export interface WishlistEntry {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}
