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

export interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
  upi_id: string | null;
  pan_number: string | null;
  trust_score: number;
  wallet_balance: number;
  is_admin: boolean;
  is_blocked: boolean;
  referred_by: string | null;
  referral_code: string | null;
  created_at: string;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: WithdrawalStatus;
  upi_id: string | null;
  pan_number: string | null;
  bank_account: string | null;
  bank_ifsc: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  checked_in_at: string;
  reward_amount: number;
}

export interface TopReferrer {
  id: string;
  name: string | null;
  referral_count: number;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  discount_type: 'percent' | 'flat';
  discount_value: number;
  product_id: string | null;
  category: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export type MissingCashbackStatus = 'pending' | 'resolved' | 'rejected';

export interface MissingCashbackRequest {
  id: string;
  user_id: string;
  order_url: string;
  platform: string;
  order_amount: number;
  order_date: string;
  screenshot_url: string | null;
  status: MissingCashbackStatus;
  admin_note: string | null;
  created_at: string;
}

export interface WishlistWithProduct {
  id: string;
  product_id: string;
  products: Product;
}

export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

export interface Review {
  id: string;
  product_id: string;
  reviewer_id: string;
  sentiment: ReviewSentiment | null;
  review_text: string | null;
  invoice_url: string | null;
  media_url: string | null;
  verified: boolean;
  created_at: string;
}

export interface CommunityDeal {
  id: string;
  user_id: string;
  product_name: string;
  product_url: string;
  price: number | null;
  category: string | null;
  image_url: string | null;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
}
