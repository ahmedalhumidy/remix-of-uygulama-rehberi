import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Product } from "@/types/stock";

/**
 * DB (as per your screenshot): shelf_inventory columns are:
 *   id, product_id, shelf_id, units, sets, updated_at
 */
export type ProductShelfInfo = {
  shelfId: string;
  shelfName: string;
  units: number;
  sets: number;
};

type EnrichedProduct = Product & {
  /** product table default shelf (single) */
  defaultRafKonum?: string;
  /** all shelves for this product (from shelf_inventory) */
  shelves?: ProductShelfInfo[];
  /** human readable multi-shelf string */
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

      // 1) Load products (base)
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
        // We'll override totals from shelf_inventory if available
        mevcutStok: Number(p.mevcut_stok ?? 0),
        setStok: Number(p.set_stok ?? 0),
        rafKonum: p.raf_konum ?? "",
        minStok: Number(p.min_stok ?? 0),
        not: p.not ?? "",
        createdAt: p.created_at,

        // keep the product table shelf as default shelf
        defaultRafKonum: p.raf_konum ?? "",
      }));

      const productIds = mapped.map((p) => p.id).filter(Boolean);

      // 2) Load shelf inventory for these products
      if (productIds.length > 0) {
        const { data: invRows, error: invErr } = await supabase
          .from("shelf_inventory")
          .select("product_id, shelf_id, units, sets, shelves(name)")
          .in("product_id", productIds);

        if (!invErr && invRows) {
          const byProduct = new Map<string, ProductShelfInfo[]>();

          invRows.forEach((r: any) => {
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

          // sort shelves by most stock
          byProduct.forEach((arr) => {
            arr.sort((a, b) => b.units + b.sets - (a.units + a.sets));
          });

          // 3) Merge back: shelves + summary + TOTALS
          mapped.forEach((p) => {
            const shelves = byProduct.get(p.id) || [];
            p.shelves = shelves;
            p.shelfSummary = buildShelfSummary(shelves, p.defaultRafKonum);

            // IMPORTANT: totals are the SUM of shelf_inventory
            if (shelves.length > 0) {
              const totalUnits = shelves.reduce((sum, s) => sum + (s.units || 0), 0);
              const totalSets = shelves.reduce((sum, s) => sum + (s.sets || 0), 0);

              p.mevcutStok = totalUnits;
              p.setStok = totalSets;
            }

            // IMPORTANT: rafKonum becomes DISPLAY string (can be multi-shelf)
            // Keep defaultRafKonum for editing inside ProductModal
            p.rafKonum = p.shelfSummary || p.defaultRafKonum || p.rafKonum;
          });
        } else if (invErr) {
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
    products.forEach((p) => m.set(p.id, p));
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