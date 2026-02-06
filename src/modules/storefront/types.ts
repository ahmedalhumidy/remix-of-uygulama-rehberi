// Store Module Types — additive, no breaking changes

export interface ProductBadge {
  type: 'new' | 'bestseller' | 'low_stock' | 'sale' | 'out_of_stock';
  label: string;
  variant: 'default' | 'destructive' | 'secondary' | 'outline';
}

export interface PromotionRule {
  id: string;
  name: string;
  description: string | null;
  promotion_type: string;
  code: string | null;
  conditions: Record<string, unknown>;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  store_id: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  media_type: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface ReviewWithVotes {
  id: string;
  product_id: string;
  customer_id: string;
  order_id: string | null;
  rating: number;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  helpful_count?: number;
  customer?: { full_name: string; avatar_url: string | null };
}

export interface OrderNote {
  id: string;
  order_id: string;
  user_id: string;
  note: string;
  is_internal: boolean;
  created_at: string;
}

export interface DeliveryEstimate {
  carrier_name: string;
  estimated_days: number;
  fee: number;
}

export interface AppliedPromotion {
  rule: PromotionRule;
  discount_amount: number;
}
