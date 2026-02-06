import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Order } from '@/types/marketplace';

export function useCustomerOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['customer-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*, product:products(id, urun_adi, images, price, sale_price)),
          shipping_address:addresses(*)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Order[];
    },
    enabled: !!user,
  });

  const createOrder = useMutation({
    mutationFn: async (orderData: {
      address_id: string;
      items: { product_id: string; store_id?: string; quantity: number; unit_price: number }[];
      subtotal: number;
      shipping_fee: number;
      total_amount: number;
      payment_method?: string;
      notes?: string;
      carrier_id?: string;
    }) => {
      if (!user) throw new Error('Giriş yapmalısınız');

      // Create order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          shipping_address_id: orderData.address_id,
          subtotal: orderData.subtotal,
          shipping_fee: orderData.shipping_fee,
          total_amount: orderData.total_amount,
          payment_method: orderData.payment_method || 'card',
          notes: orderData.notes,
          carrier_id: orderData.carrier_id,
          status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Create order items
      const items = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        store_id: item.store_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(items);

      if (itemsErr) throw itemsErr;
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-orders', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  return {
    orders: ordersQuery.data ?? [],
    isLoading: ordersQuery.isLoading,
    createOrder,
  };
}

export function useAddresses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addressesQuery = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const addAddress = useMutation({
    mutationFn: async (address: {
      full_name: string;
      phone: string;
      city: string;
      district?: string;
      street_address: string;
      postal_code?: string;
      label?: string;
      is_default?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('addresses')
        .insert({ ...address, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
    },
  });

  return {
    addresses: addressesQuery.data ?? [],
    isLoading: addressesQuery.isLoading,
    addAddress,
  };
}
