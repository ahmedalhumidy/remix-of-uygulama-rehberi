import { useMemo } from 'react';
import { MapPin, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Product } from '@/types/stock';
import { useShelves } from '@/hooks/useShelves';

type MovementLike = {
  productId: string;
  productName: string;
  type: 'giris' | 'cikis';
  quantity: number;
  setQuantity: number;
  shelfId?: string;
  shelfName?: string;
};

interface LocationViewProps {
  products: Product[];
  movements?: MovementLike[];
  searchQuery: string;
  onViewProduct?: (id: string) => void;
}

type ShelfRow = {
  shelfId: string;
  shelfName: string;
  products: Array<{
    productId: string;
    productName: string;
    units: number;
    sets: number;
    isPrimary: boolean;
  }>;
};

function norm(s?: string | null) {
  return (s || '').trim().toLowerCase();
}

export function LocationView({ products, movements = [], searchQuery, onViewProduct }: LocationViewProps) {
  const { shelves, loading } = useShelves();

  const rows: ShelfRow[] = useMemo(() => {
    // 1) Base: show current "primary" location from products.rafKonum
    const byShelfName = new Map<string, ShelfRow>();

    const ensure = (shelfId: string, shelfName: string) => {
      const key = norm(shelfName);
      if (!byShelfName.has(key)) {
        byShelfName.set(key, { shelfId, shelfName, products: [] });
      }
      return byShelfName.get(key)!;
    };

    // Create rows for ALL shelves (حتى لو فاضية)
    (shelves || []).forEach(s => ensure(s.id, s.name));

    // Primary shelf from product location
    products.forEach(p => {
      const shelfName = (p as any).rafKonum || (p as any).raf_konum || '';
      const shelf = (shelves || []).find(x => norm(x.name) === norm(shelfName));
      if (!shelf || !shelfName) return;

      const row = ensure(shelf.id, shelf.name);
      row.products.push({
        productId: p.id,
        productName: (p as any).urunAdi || (p as any).urun_adi || 'Ürün',
        units: (p as any).mevcutStok ?? (p as any).mevcut_stok ?? 0,
        sets: (p as any).setStok ?? (p as any).set_stok ?? 0,
        isPrimary: true,
      });
    });

    // 2) Secondary shelf: from movements shelfName/shelfId (so barcode giriş يظهر بالرف الجديد)
    // Compute net per shelfName + productId
    const net = new Map<string, { units: number; sets: number; name: string }>();

    movements.forEach(m => {
      const shelfName = m.shelfName || '';
      if (!shelfName) return;

      const sign = m.type === 'giris' ? 1 : -1;
      const key = `${norm(shelfName)}::${m.productId}`;
      const cur = net.get(key) || { units: 0, sets: 0, name: m.productName };
      cur.units += sign * (m.quantity || 0);
      cur.sets += sign * (m.setQuantity || 0);
      cur.name = m.productName || cur.name;
      net.set(key, cur);
    });

    // Add secondary products only if:
    // - net positive
    // - AND this shelf is NOT the primary shelf for that product (حتى ما ننقل القديم)
    net.forEach((val, key) => {
      const [shelfKey, productId] = key.split('::');
      if (!shelfKey || !productId) return;
      if (val.units <= 0 && val.sets <= 0) return;

      const shelfObj = (shelves || []).find(s => norm(s.name) === shelfKey);
      if (!shelfObj) return;

      const product = products.find(p => p.id === productId);
      const primaryName = norm((product as any)?.rafKonum || (product as any)?.raf_konum || '');
      if (primaryName === shelfKey) return; // already shown as primary

      const row = ensure(shelfObj.id, shelfObj.name);
      row.products.push({
        productId,
        productName: val.name || 'Ürün',
        units: val.units,
        sets: val.sets,
        isPrimary: false,
      });
    });

    // Sort products in each shelf
    const result = Array.from(byShelfName.values()).map(r => ({
      ...r,
      products: r.products.sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return a.productName.localeCompare(b.productName);
      }),
    }));

    // Apply search
    const q = norm(searchQuery);
    if (!q) return result;

    return result.filter(r => {
      if (norm(r.shelfName).includes(q)) return true;
      return r.products.some(p => norm(p.productName).includes(q));
    });
  }, [products, movements, shelves, searchQuery]);

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Raf bulunamadı (arama filtresini kontrol edin)
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map(row => {
        const count = row.products.length;
        return (
          <Card key={row.shelfId} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <div className="font-semibold">{row.shelfName}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="w-4 h-4" />
                {count}
              </div>
            </div>

            {count === 0 ? (
              <div className="mt-3 text-sm text-muted-foreground">
                Bu raf boş
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {row.products.slice(0, 8).map(p => (
                  <button
                    key={`${row.shelfId}-${p.productId}-${p.isPrimary ? 'p' : 's'}`}
                    onClick={() => onViewProduct?.(p.productId)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-lg border p-2 text-left hover:bg-muted/40 transition',
                      !p.isPrimary && 'border-dashed'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{p.productName}</div>
                      {!p.isPrimary && (
                        <div className="text-[11px] text-muted-foreground">
                          Bu raf için ek giriş (barcode) olarak gösteriliyor
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">{p.units} adet</Badge>
                      <Badge variant="outline">{p.sets} set</Badge>
                    </div>
                  </button>
                ))}

                {count > 8 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    + {count - 8} ürün daha...
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}