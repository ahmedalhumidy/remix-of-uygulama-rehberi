 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from './useAuth';
 import type { 
   MarketplaceProduct, 
   CartItem, 
   WishlistItem, 
   Store,
   ShippingCarrier
 } from '@/types/marketplace';
 
 // Fetch published products for storefront
 export function usePublishedProducts(category?: string) {
   return useQuery({
     queryKey: ['published-products', category],
     queryFn: async () => {
       let query = supabase
         .from('products')
         .select(`
           *,
           store:stores(id, store_name, store_slug, logo_url, is_verified)
         `)
         .eq('is_published', true)
         .eq('is_deleted', false)
         .gt('mevcut_stok', 0);
 
       if (category) {
         query = query.eq('category', category);
       }
 
       const { data, error } = await query.order('created_at', { ascending: false });
       
       if (error) throw error;
       return data as unknown as MarketplaceProduct[];
     },
   });
 }
 
 // Fetch single product details
 export function useProductDetails(productId: string) {
   return useQuery({
     queryKey: ['product-details', productId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('products')
         .select(`
           *,
           store:stores(id, store_name, store_slug, logo_url, is_verified, address, city)
         `)
         .eq('id', productId)
         .single();
       
       if (error) throw error;
       return data as unknown as MarketplaceProduct;
     },
     enabled: !!productId,
   });
 }
 
 // Cart operations
 export function useCart() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const cartQuery = useQuery({
     queryKey: ['cart', user?.id],
     queryFn: async () => {
       if (!user) return [];
       
       const { data, error } = await supabase
         .from('cart_items')
         .select(`
           *,
           product:products(*)
         `)
         .eq('user_id', user.id);
       
       if (error) throw error;
       return data as unknown as CartItem[];
     },
     enabled: !!user,
   });
 
   const addToCart = useMutation({
     mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
       if (!user) throw new Error('User not authenticated');
       
       const { data, error } = await supabase
         .from('cart_items')
         .upsert({
           user_id: user.id,
           product_id: productId,
           quantity,
         }, {
           onConflict: 'user_id,product_id',
         })
         .select()
         .single();
       
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
     },
   });
 
   const updateQuantity = useMutation({
     mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
       const { data, error } = await supabase
         .from('cart_items')
         .update({ quantity })
         .eq('id', itemId)
         .select()
         .single();
       
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
     },
   });
 
   const removeFromCart = useMutation({
     mutationFn: async (itemId: string) => {
       const { error } = await supabase
         .from('cart_items')
         .delete()
         .eq('id', itemId);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
     },
   });
 
   const clearCart = useMutation({
     mutationFn: async () => {
       if (!user) throw new Error('User not authenticated');
       
       const { error } = await supabase
         .from('cart_items')
         .delete()
         .eq('user_id', user.id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
     },
   });
 
   return {
     cart: cartQuery.data ?? [],
     isLoading: cartQuery.isLoading,
     addToCart,
     updateQuantity,
     removeFromCart,
     clearCart,
   };
 }
 
 // Wishlist operations
 export function useWishlist() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const wishlistQuery = useQuery({
     queryKey: ['wishlist', user?.id],
     queryFn: async () => {
       if (!user) return [];
       
       const { data, error } = await supabase
         .from('wishlist')
         .select(`
           *,
           product:products(*)
         `)
         .eq('user_id', user.id);
       
       if (error) throw error;
       return data as unknown as WishlistItem[];
     },
     enabled: !!user,
   });
 
   const toggleWishlist = useMutation({
     mutationFn: async (productId: string) => {
       if (!user) throw new Error('User not authenticated');
       
       // Check if already in wishlist
       const { data: existing } = await supabase
         .from('wishlist')
         .select('id')
         .eq('user_id', user.id)
         .eq('product_id', productId)
         .single();
       
       if (existing) {
         // Remove from wishlist
         const { error } = await supabase
           .from('wishlist')
           .delete()
           .eq('id', existing.id);
         if (error) throw error;
         return { action: 'removed' };
       } else {
         // Add to wishlist
         const { error } = await supabase
           .from('wishlist')
           .insert({
             user_id: user.id,
             product_id: productId,
           });
         if (error) throw error;
         return { action: 'added' };
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
     },
   });
 
   const isInWishlist = (productId: string) => {
     return wishlistQuery.data?.some(item => item.product_id === productId) ?? false;
   };
 
   return {
     wishlist: wishlistQuery.data ?? [],
     isLoading: wishlistQuery.isLoading,
     toggleWishlist,
     isInWishlist,
   };
 }
 
 // Shipping carriers
 export function useShippingCarriers() {
   return useQuery({
     queryKey: ['shipping-carriers'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('shipping_carriers')
         .select('*')
         .eq('is_active', true)
         .order('name');
       
       if (error) throw error;
       return data as ShippingCarrier[];
     },
   });
 }
 
 // Stores
 export function useStores() {
   return useQuery({
     queryKey: ['stores'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('stores')
         .select('*')
         .eq('is_active', true)
         .order('store_name');
       
       if (error) throw error;
       return data as Store[];
     },
   });
 }
 
 // Get user's store (for merchants)
 export function useMyStore() {
   const { user } = useAuth();
 
   return useQuery({
     queryKey: ['my-store', user?.id],
     queryFn: async () => {
       if (!user) return null;
       
       const { data, error } = await supabase
         .from('stores')
         .select('*')
         .eq('owner_id', user.id)
         .single();
       
       if (error && error.code !== 'PGRST116') throw error;
       return data as Store | null;
     },
     enabled: !!user,
   });
 }