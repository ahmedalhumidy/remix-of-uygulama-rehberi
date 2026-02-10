import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addToOfflineQueue, isOnline } from '@/lib/offlineSync';

export interface StockMovementInput {
  productId: string;
  type: 'giris' | 'cikis';
  quantity: number;
  setQuantity?: number;
  date: string;
  time: string;
  note?: string;
  shelfId: string; // ✅ REQUIRED
}

export interface StockMovementResult {
  id: string;
  productId: string;
  productName: string;
  type: 'giris' | 'cikis';
  quantity: number;
  setQuantity: number;
  date: string;
  time?: string;
  handledBy: string;
  note?: string;
  shelfId?: string;
  shelfName?: string;
}

async function fetchShelfStock(productId: string, shelfId: string): Promise<{ units: number; sets: number }> {
  const { data, error } = await supabase
    .from('shelf_inventory')
    .select('units, sets')
    .eq('product_id', productId)
    .eq('shelf_id', shelfId)
    .maybeSingle();

  if (error) throw error;

  return {
    units: Number((data as any)?.units ?? 0) || 0,
    sets: Number((data as any)?.sets ?? 0) || 0,
  };
}

export const stockService = {
  async createMovement(input: StockMovementInput): Promise<StockMovementResult | null> {
    // ✅ Shelf is required
    if (!input.shelfId) {
      toast.error('Lütfen raf seçin');
      return null;
    }

    // Offline => queue
    if (!isOnline()) {
      addToOfflineQueue({
        type: 'stock_movement',
        data: {
          productId: input.productId,
          type: input.type,
          quantity: input.quantity,
          setQuantity: input.setQuantity || 0,
          date: input.date,
          time: input.time,
          note: input.note,
          shelfId: input.shelfId,
        },
      });

      toast.info('Çevrimdışı - işlem sıraya eklendi', {
        description: 'İnternet bağlantısı sağlandığında otomatik senkronize edilecek',
      });
      return null;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;

      if (!userId) {
        toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        toast.error('Kullanıcı profili bulunamadı');
        return null;
      }

      // ✅ Çıkış: check stock per selected shelf (NOT global)
      if (input.type === 'cikis') {
        const shelfStock = await fetchShelfStock(input.productId, input.shelfId);

        const reqUnits = input.quantity || 0;
        const reqSets = input.setQuantity || 0;

        if (reqUnits > shelfStock.units) {
          toast.error(`Yetersiz raf stoğu: Raf ${shelfStock.units}, Talep ${reqUnits}`);
          return null;
        }
        if (reqSets > shelfStock.sets) {
          toast.error(`Yetersiz raf set stoğu: Raf ${shelfStock.sets}, Talep ${reqSets}`);
          return null;
        }
      }

      // ✅ Insert movement
      const { data: inserted, error: insertErr } = await supabase
        .from('stock_movements')
        .insert({
          product_id: input.productId,
          movement_type: input.type,
          quantity: input.quantity,
          set_quantity: input.setQuantity || 0,
          movement_date: input.date,
          movement_time: input.time,
          handled_by: profile.full_name,
          notes: input.note || null,
          created_by: userId,
          shelf_id: input.shelfId,
          is_deleted: false,
        })
        .select('id, product_id, movement_type, quantity, set_quantity, movement_date, movement_time, handled_by, notes, shelf_id')
        .single();

      if (insertErr) throw insertErr;

      // ✅ Fetch with joins (optional)
      const { data: full } = await supabase
        .from('stock_movements')
        .select('id, product_id, movement_type, quantity, set_quantity, movement_date, movement_time, handled_by, notes, shelf_id, products(urun_adi), shelves(name)')
        .eq('id', inserted.id)
        .single();

      const row = (full as any) || inserted;

      const result: StockMovementResult = {
        id: row.id,
        productId: row.product_id,
        productName: row?.products?.urun_adi || 'Bilinmeyen Ürün',
        type: row.movement_type as 'giris' | 'cikis',
        quantity: row.quantity,
        setQuantity: row.set_quantity || 0,
        date: row.movement_date,
        time: row.movement_time?.slice(0, 5) || undefined,
        handledBy: row.handled_by,
        note: row.notes || undefined,
        shelfId: row.shelf_id || undefined,
        shelfName: row?.shelves?.name || undefined,
      };

      const setInfo = (input.setQuantity || 0) > 0 ? ` + ${input.setQuantity} set` : '';
      toast.success(
        input.type === 'giris'
          ? `${input.quantity} adet${setInfo} stok girişi yapıldı`
          : `${input.quantity} adet${setInfo} stok çıkışı yapıldı`
      );

      return result;
    } catch (err) {
      console.error('Error creating stock movement:', err);
      toast.error('Hareket eklenirken hata oluştu');
      return null;
    }
  },

  async fetchMovements(): Promise<StockMovementResult[]> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, products(urun_adi), shelves(name)')
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        productId: m.product_id,
        productName: m.products?.urun_adi || 'Bilinmeyen Ürün',
        type: m.movement_type as 'giris' | 'cikis',
        quantity: m.quantity,
        setQuantity: m.set_quantity || 0,
        date: m.movement_date,
        time: m.movement_time?.slice(0, 5) || undefined,
        handledBy: m.handled_by,
        note: m.notes || undefined,
        shelfId: m.shelf_id || undefined,
        shelfName: m.shelves?.name || undefined,
      }));
    } catch (err) {
      console.error('Error fetching movements:', err);
      toast.error('Hareketler yüklenirken hata oluştu');
      return [];
    }
  },
};