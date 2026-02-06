import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MarketplaceProduct } from '@/types/marketplace';

export function useRecommendations(productId: string | undefined, category?: string | null) {
  // Related products (same category, excluding current)
  const relatedQuery = useQuery({
    queryKey: ['related-products', productId, category],
    queryFn: async () => {
      if (!productId) return [];
      let query = supabase
        .from('products')
        .select('*, store:stores(id, store_name, store_slug, logo_url, is_verified)')
        .eq('is_published', true)
        .eq('is_deleted', false)
        .neq('id', productId)
        .gt('mevcut_stok', 0)
        .limit(8);

      if (category) query = query.eq('category', category);

      const { data, error } = await query.order('toplam_cikis', { ascending: false });
      if (error) return [];
      return (data || []) as unknown as MarketplaceProduct[];
    },
    enabled: !!productId,
  });

  // Best sellers (frequently bought - based on highest sales)
  const bestsellersQuery = useQuery({
    queryKey: ['bestseller-products', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, store:stores(id, store_name, store_slug, logo_url, is_verified)')
        .eq('is_published', true)
        .eq('is_deleted', false)
        .neq('id', productId || '')
        .gt('mevcut_stok', 0)
        .order('toplam_cikis', { ascending: false })
        .limit(6);
      if (error) return [];
      return (data || []) as unknown as MarketplaceProduct[];
    },
    enabled: !!productId,
  });

  return {
    relatedProducts: relatedQuery.data ?? [],
    frequentlyBought: bestsellersQuery.data ?? [],
    isLoading: relatedQuery.isLoading || bestsellersQuery.isLoading,
  };
}
