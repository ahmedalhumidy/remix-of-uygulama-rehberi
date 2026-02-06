import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PromotionRule, AppliedPromotion } from '../types';

export function usePromotions() {
  const queryClient = useQueryClient();

  const promotionsQuery = useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotion_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PromotionRule[];
    },
  });

  const validateCoupon = useMutation({
    mutationFn: async ({ code, cartTotal }: { code: string; cartTotal: number }) => {
      const { data, error } = await supabase
        .from('promotion_rules')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .eq('promotion_type', 'coupon')
        .single();

      if (error || !data) throw new Error('Geçersiz kupon kodu');

      const rule = data as unknown as PromotionRule;

      // Check expiry
      if (rule.expires_at && new Date(rule.expires_at) < new Date()) {
        throw new Error('Bu kupon kodunun süresi dolmuş');
      }
      // Check start date
      if (rule.starts_at && new Date(rule.starts_at) > new Date()) {
        throw new Error('Bu kupon henüz aktif değil');
      }
      // Check usage limit
      if (rule.usage_limit && rule.usage_count >= rule.usage_limit) {
        throw new Error('Bu kupon kullanım limitine ulaşmış');
      }
      // Check minimum order amount
      if (rule.min_order_amount && cartTotal < rule.min_order_amount) {
        throw new Error(`Minimum sipariş tutarı: ₺${rule.min_order_amount}`);
      }

      return rule;
    },
  });

  const calculateDiscount = (rule: PromotionRule, subtotal: number): AppliedPromotion => {
    let discount = 0;
    if (rule.discount_type === 'percentage') {
      discount = (subtotal * rule.discount_value) / 100;
    } else {
      discount = rule.discount_value;
    }
    if (rule.max_discount_amount && discount > rule.max_discount_amount) {
      discount = rule.max_discount_amount;
    }
    return { rule, discount_amount: Math.min(discount, subtotal) };
  };

  const getAutoPromotions = (cartTotal: number, category?: string): AppliedPromotion[] => {
    if (!promotionsQuery.data) return [];
    const applied: AppliedPromotion[] = [];

    for (const rule of promotionsQuery.data) {
      if (rule.promotion_type === 'coupon') continue; // coupons are manual

      if (rule.promotion_type === 'cart_threshold' && cartTotal >= rule.min_order_amount) {
        applied.push(calculateDiscount(rule, cartTotal));
      }
      if (rule.promotion_type === 'category_discount' && category && rule.category === category) {
        applied.push(calculateDiscount(rule, cartTotal));
      }
    }
    return applied;
  };

  return {
    promotions: promotionsQuery.data ?? [],
    isLoading: promotionsQuery.isLoading,
    validateCoupon,
    calculateDiscount,
    getAutoPromotions,
  };
}
