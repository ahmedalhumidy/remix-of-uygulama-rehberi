import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ReviewWithVotes } from '../types';

export function useReviews(productId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('reviews')
        .select(`*, customer:profiles!reviews_customer_id_fkey(full_name, avatar_url)`)
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) {
        // Fallback without join if FK doesn't exist
        const { data: fallback, error: fallbackErr } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', productId)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });
        if (fallbackErr) throw fallbackErr;
        return (fallback || []) as unknown as ReviewWithVotes[];
      }
      return (data || []) as unknown as ReviewWithVotes[];
    },
    enabled: !!productId,
  });

  const submitReview = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment?: string }) => {
      if (!user || !productId) throw new Error('Giriş yapmalısınız');
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          customer_id: user.id,
          rating,
          comment: comment || null,
          is_approved: false,
          is_verified_purchase: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
    },
  });

  const voteReview = useMutation({
    mutationFn: async ({ reviewId, voteType }: { reviewId: string; voteType: string }) => {
      if (!user) throw new Error('Giriş yapmalısınız');
      const { error } = await supabase
        .from('review_votes')
        .upsert({
          review_id: reviewId,
          user_id: user.id,
          vote_type: voteType,
        }, { onConflict: 'review_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
    },
  });

  const averageRating = (reviewsQuery.data ?? []).length > 0
    ? (reviewsQuery.data ?? []).reduce((sum, r) => sum + r.rating, 0) / (reviewsQuery.data ?? []).length
    : 0;

  return {
    reviews: reviewsQuery.data ?? [],
    isLoading: reviewsQuery.isLoading,
    averageRating,
    reviewCount: (reviewsQuery.data ?? []).length,
    submitReview,
    voteReview,
  };
}
