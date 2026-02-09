import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Package } from "lucide-react";
import type { Product } from "@/types/stock";

type ShelfRow = { id: string; name: string };

type InventoryRow = {
  product_id: string;
  shelf_id: string;
  units: number;
  sets: number;
  products?: {
    id: string;
    urun_adi?: string | null;
    urun_kodu?: string | null;
    barkod?: string | null;
  } | null;
  shelves?: {
    id: string;
    name?: string | null;
  } | null;
};

interface LocationViewProps {
  products: Product[]; // kept for compatibility with your app
  searchQuery: string;
  onViewProduct: (id: string) => void;
}

export function LocationView({ searchQuery, onViewProduct }: LocationViewProps) {
  const [shelves, setShelves] = useState<ShelfRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      // 1) fetch ALL shelves (to show empty shelves too)
      const { data: shelfData, error: shelfErr } = await supabase
        .from("shelves")
        .select("id, name")
        .order("name", { ascending: true });

      if (shelfErr) {
        console.error(shelfErr);
      }

      // 2) fetch shelf_inventory with joins
      const { data: invData, error: invErr } = await supabase
        .from("shelf_inventory")
        .select("product_id, shelf_id, units, sets, products(id, urun_adi, urun_kodu, barkod), shelves(id, name)")
        .order("updated_at", { ascending: false });

      if (invErr) {
        console.error(invErr);
      }

      if (!mounted) return;

      setShelves((shelfData || []).map((s) => ({ id: s.id, name: s.name })));
      setInventory((invData || []) as any);
      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const q = (searchQuery || "").trim().toLowerCase();

  const shelfToItems = useMemo(() => {
    // filter inventory by search query (product name/code/barcode)
    const filteredInv = !q
      ? inventory
      : inventory.filter((row) => {
          const p = row.products;
          const name = (p?.urun_adi || "").toLowerCase();
          const code = (p?.urun_kodu || "").toLowerCase();
          const barcode = (p?.barkod || "").toLowerCase();
          const shelfName = (row.shelves?.name || "").toLowerCase();
          return (
            name.includes(q) ||
            code.includes(q) ||
            barcode.includes(q) ||
            shelfName.includes(q)
          );
        });

    const map: Record<string, InventoryRow[]> = {};
    for (const row of filteredInv) {
      if (!map[row.shelf_id]) map[row.shelf_id] = [];
      // show only items that actually exist in that shelf (units/sets > 0)
      if ((row.units || 0) > 0 || (row.sets || 0) > 0) {
        map[row.shelf_id].push(row);
      }
    }
    return map;
  }, [inventory, q]);

  const visibleShelves = useMemo(() => {
    // If searching, show only shelves that match OR contain results
    if (!q) return shelves;

    return shelves.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(q);
      const hasItems = (shelfToItems[s.id] || []).length > 0;
      return nameMatch || hasItems;
    });
  }, [shelves, shelfToItems, q]);

  if (loading) {
    return (
      <div className="py-10 flex items-center justify-center text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleShelves.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          Hiç raf bulunamadı.
        </div>
      ) : (
        visibleShelves.map((shelf) => {
          const items = shelfToItems[shelf.id] || [];
          const totalUnits = items.reduce((a, r) => a + (r.units || 0), 0);
          const totalSets = items.reduce((a, r) => a + (r.sets || 0), 0);

          return (
            <Card key={shelf.id} className="overflow-hidden">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-4 h-4 text-primary" />
                  {shelf.name}
                  <div className="ml-auto flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Package className="w-3.5 h-3.5" />
                      {items.length} ürün
                    </Badge>
                    <Badge variant="outline">
                      {totalUnits} adet{totalSets > 0 ? ` • ${totalSets} set` : ""}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="pb-4">
                {items.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-3">
                    Bu raf boş.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((row) => {
                      const p = row.products;
                      const name = p?.urun_adi || "Bilinmeyen Ürün";
                      const code = p?.urun_kodu || "";
                      const barcode = p?.barkod || "";

                      return (
                        <div
                          key={`${row.shelf_id}-${row.product_id}`}
                          className="flex items-center justify-between gap-3 rounded-lg border p-3"
                        >
                          <div className="min-w-0">
                            <div className="font-medium truncate">{name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {code ? `Kod: ${code}` : ""}{code && barcode ? " • " : ""}{barcode ? `Barkod: ${barcode}` : ""}
                            </div>
                            <div className="text-xs mt-1">
                              <Badge variant="outline">{row.units || 0} adet</Badge>
                              {" "}
                              <Badge variant="outline">{row.sets || 0} set</Badge>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewProduct(p?.id || row.product_id)}
                          >
                            Aç
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}