import { useEffect, useMemo, useState } from 'react';
import { MapPin, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@/types/stock';

type ShelfRow = { id: string; name: string };
type InvRow = {
  shelf_id: string;
  product_id: string;
  units: number;
  sets: number;
  products: { urun_adi: string; urun_kodu: string; barkod: string | null } | null;
};

interface LocationViewProps {
  products: Product[]; // not used anymore, but kept to avoid breaking props
  movements?: any[];   // not used anymore, but kept to avoid breaking props
  searchQuery: string;
  onViewProduct: (id: string) => void;
}

export function LocationView({ searchQuery, onViewProduct }: LocationViewProps) {
  const [shelves, setShelves] = useState<ShelfRow[]>([]);
  const [inventory, setInventory] = useState<InvRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const { data: shelvesData, error: shelvesErr } = await supabase
        .from('shelves')
        .select('id, name')
        .order('name', { ascending: true });

      if (shelvesErr) {
        console.error(shelvesErr);
        if (mounted) setShelves([]);
      } else {
        if (mounted) setShelves((shelvesData || []) as ShelfRow[]);
      }

      // pull ALL shelf_inventory rows + product info
      const { data: invData, error: invErr } = await supabase
        .from('shelf_inventory')
        .select('shelf_id, product_id, units, sets, products(urun_adi, urun_kodu, barkod)')
        .order('updated_at', { ascending: false });

      if (invErr) {
        console.error(invErr);
        if (mounted) setInventory([]);
      } else {
        if (mounted) setInventory((invData || []) as InvRow[]);
      }

      if (mounted) setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, []);

  const grouped = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();

    // group inventory rows by shelf_id
    const byShelf = new Map<string, InvRow[]>();
    for (const row of inventory) {
      // ignore zero rows
      const u = row.units || 0;
      const s = row.sets || 0;
      if (u === 0 && s === 0) continue;

      const list = byShelf.get(row.shelf_id) || [];
      list.push(row);
      byShelf.set(row.shelf_id, list);
    }

    // build shelves list (include empty shelves)
    const result = shelves.map(sh => {
      const rows = byShelf.get(sh.id) || [];

      // search filter: shelf name OR product fields
      let filteredRows = rows;
      if (q) {
        const shelfMatch = sh.name.toLowerCase().includes(q);
        filteredRows = shelfMatch
          ? rows
          : rows.filter(r => {
              const p = r.products;
              const name = (p?.urun_adi || '').toLowerCase();
              const code = (p?.urun_kodu || '').toLowerCase();
              const barcode = (p?.barkod || '').toLowerCase();
              return name.includes(q) || code.includes(q) || barcode.includes(q);
            });
      }

      return {
        shelfId: sh.id,
        shelfName: sh.name,
        rows: filteredRows,
      };
    });

    // hide shelves that don’t match search at all
    if (q) {
      return result.filter(s =>
        s.shelfName.toLowerCase().includes(q) || s.rows.length > 0
      );
    }

    return result;
  }, [shelves, inventory, searchQuery]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Yükleniyor...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
            Raf bulunamadı (arama filtresini kontrol edin)
          </CardContent>
        </Card>
      ) : (
        grouped.map((shelf) => (
          <Card key={shelf.shelfId} className="overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {shelf.shelfName}
                <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {shelf.rows.length}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0 pb-3">
              {shelf.rows.length === 0 ? (
                <div className="p-3 rounded-lg border text-sm text-muted-foreground">
                  Bu raf boş
                </div>
              ) : (
                <div className="space-y-2">
                  {shelf.rows.map((r) => {
                    const p = r.products;
                    return (
                      <button
                        key={`${r.product_id}-${r.shelf_id}`}
                        onClick={() => onViewProduct(r.product_id)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-muted/40 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{p?.urun_adi || 'Bilinmeyen Ürün'}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {p?.urun_kodu || ''}{p?.barkod ? ` • ${p.barkod}` : ''}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-semibold">{r.units} adet</div>
                            <div className="text-xs text-muted-foreground">{r.sets} set</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}