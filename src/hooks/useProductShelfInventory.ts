import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProductShelfRow = {
  shelf_id: string;
  shelf_name: string;
  units: number;
  sets: number;
  updated_at: string;
};

export function useProductShelfInventory(productId?: string) {
  const [rows, setRows] = useState<ProductShelfRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!productId) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Join shelf_inventory with shelves to get shelf name
    const { data, error } = await supabase
      .from("shelf_inventory")
      .select("shelf_id, units, sets, updated_at, shelves(name)")
      .eq("product_id", productId);

    if (error) {
      setError(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const mapped: ProductShelfRow[] = (data ?? []).map((r: any) => ({
      shelf_id: r.shelf_id,
      shelf_name: r?.shelves?.name ?? "—",
      units: r.units ?? 0,
      sets: r.sets ?? 0,
      updated_at: r.updated_at,
    }));

    // Sort by shelf_name
    mapped.sort((a, b) => a.shelf_name.localeCompare(b.shelf_name, "tr"));

    setRows(mapped);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return { rows, loading, error, reload: load };
}