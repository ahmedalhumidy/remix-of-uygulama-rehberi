import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockMovement, Product } from '@/types/stock';
import { toast } from 'sonner';

export function useMovements(products: Product[]) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, products(urun_adi)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedMovements: StockMovement[] = (data || []).map(m => ({
        id: m.id,
        productId: m.product_id,
        productName: (m.products as any)?.urun_adi || 'Bilinmeyen Ürün',
        type: m.movement_type as 'giris' | 'cikis',
        quantity: m.quantity,
        date: m.movement_date,
        time: m.movement_time?.slice(0, 5) || undefined,
        handledBy: m.handled_by,
        note: m.notes || undefined,
      }));

      setMovements(mappedMovements);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast.error('Hareketler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const addMovement = async (data: {
    productId: string;
    type: 'giris' | 'cikis';
    quantity: number;
    date: string;
    time: string;
    handledBy: string;
    note?: string;
  }) => {
    try {
      const product = products.find(p => p.id === data.productId);
      if (!product) {
        toast.error('Ürün bulunamadı');
        return null;
      }

      const { data: session } = await supabase.auth.getSession();

      const { data: newMovement, error } = await supabase
        .from('stock_movements')
        .insert({
          product_id: data.productId,
          movement_type: data.type,
          quantity: data.quantity,
          movement_date: data.date,
          movement_time: data.time,
          handled_by: data.handledBy,
          notes: data.note || null,
          created_by: session.session?.user.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      const mappedMovement: StockMovement = {
        id: newMovement.id,
        productId: newMovement.product_id,
        productName: product.urunAdi,
        type: newMovement.movement_type as 'giris' | 'cikis',
        quantity: newMovement.quantity,
        date: newMovement.movement_date,
        time: newMovement.movement_time?.slice(0, 5) || undefined,
        handledBy: newMovement.handled_by,
        note: newMovement.notes || undefined,
      };

      setMovements(prev => [mappedMovement, ...prev]);
      
      toast.success(
        data.type === 'giris' 
          ? `${data.quantity} adet stok girişi yapıldı` 
          : `${data.quantity} adet stok çıkışı yapıldı`
      );

      return mappedMovement;
    } catch (error) {
      console.error('Error adding movement:', error);
      toast.error('Hareket eklenirken hata oluştu');
      return null;
    }
  };

  const refreshMovements = () => {
    setLoading(true);
    fetchMovements();
  };

  return {
    movements,
    loading,
    addMovement,
    refreshMovements,
    setMovements,
  };
}
