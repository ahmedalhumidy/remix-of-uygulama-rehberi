import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Product } from "@/types/stock";

export type ProductShelfInfo = {
  shelfId: string;
  shelfName: string;
  units: number;
  sets: number;
};

type EnrichedProduct = Product & {
  shelves?: ProductShelfInfo[];
  shelfSummary?: string;
};

function buildShelfSummary(shelves?: ProductShelfInfo[], fallback?: string) {
  if (!shelves || shelves.length === 0) return fallback || "";
  return shelves.map((s) => s.shelfName).join(", ");
}

export function useProducts() {
  const [products, setProducts] = useState<EnrichedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: EnrichedProduct[] = (data || []).map((p: any) => ({
        id: p.id,
        urunKodu: p.urun_kodu,
        urunAdi: p.urun_adi,
        barkod: p.barkod,
        mevcutStok: p.mevcut_stok ?? 0,
        setStok: p.set_stok ?? 0,
        rafKonum: p.raf_konum ?? "",
        minStok: p.min_stok ?? 0,
        not: p.not ?? "",
        createdAt: p.created_at,
      }));

      const productIds = mapped.map((p: any) => p.id).filter(Boolean);

      if (productIds.length > 0) {
        const { data: invRows, error: invErr } = await supabase
          .from("shelf_inventory")
          .select("product_id, shelf_id, units, sets, shelves(name)")
          .in("product_id", productIds);

        if (!invErr) {
          const byProduct = new Map<string, ProductShelfInfo[]>();

          (invRows || []).forEach((r: any) => {
            const pid = r.product_id as string;
            const shelfId = r.shelf_id as string;
            const shelfName = (r.shelves as any)?.name as string | undefined;
            if (!pid || !shelfId || !shelfName) return;

            const entry: ProductShelfInfo = {
              shelfId,
              shelfName,
              units: Number(r.units ?? 0),
              sets: Number(r.sets ?? 0),
            };

            const arr = byProduct.get(pid) || [];
            arr.push(entry);
            byProduct.set(pid, arr);
          });

          byProduct.forEach((arr) => {
            arr.sort((a, b) => (b.units + b.sets) - (a.units + a.sets));
          });

          mapped.forEach((p: any) => {
            const shelves = byProduct.get(p.id) || [];
            p.shelves = shelves;
            p.shelfSummary = buildShelfSummary(shelves, p.rafKonum);
          });
        } else {
          console.warn("shelf_inventory fetch failed:", invErr);
        }
      }

      setProducts(mapped);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Ürünler yüklenirken hata oluştu");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const productsById = useMemo(() => {
    const m = new Map<string, EnrichedProduct>();
    products.forEach((p: any) => m.set(p.id, p));
    return m;
  }, [products]);

  return {
    products,
    loading,
    refreshProducts: fetchProducts,
    productsById,
  };
}

// Make import robust for Index.tsx and anywhere else
export default useProducts;