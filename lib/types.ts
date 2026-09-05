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
