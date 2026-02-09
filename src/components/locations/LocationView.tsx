import { useMemo } from 'react';
import { MapPin, Package } from 'lucide-react';
import { Product, StockMovement } from '@/types/stock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShelves } from '@/hooks/useShelves';

interface LocationViewProps {
  products: Product[];
  movements?: StockMovement[];
  searchQuery: string;
  onViewProduct: (id: string) => void;
}

type ShelfProductRow = {
  productId: string;
  urunAdi: string;
  urunKodu: string;
  barkod?: string | null;
  units: number;
  sets: number;
};

type ShelfViewModel = {
  shelfId: string;
  shelfName: string;
  products: ShelfProductRow[];
};

function norm(s?: string | null) {
  return (s || '').toLowerCase().trim();
}

export function LocationView({ products, movements = [], searchQuery, onViewProduct }: LocationViewProps) {
  const { shelves: dbShelves } = useShelves();

  const viewModels: ShelfViewModel[] = useMemo(() => {
    // Build product lookup
    const productById = new Map<string, Product>();
    for (const p of products) productById.set(p.id, p);

    // Aggregate movements by shelf -> product
    const shelfMap = new Map<string, ShelfViewModel>();

    const ensureShelf = (shelfId: string, shelfName: string) => {
      const existing = shelfMap.get(shelfId);
      if (existing) return existing;
      const created: ShelfViewModel = { shelfId, shelfName, products: [] };
      shelfMap.set(shelfId, created);
      return created;
    };

    // 1) Start with ALL shelves from DB (so empty shelves still appear)
    for (const s of dbShelves) {
      ensureShelf(s.id, s.name);
    }

    // Optional: a "Genel" bucket for movements without shelf_id
    const GENERAL_ID = '__general__';
    const GENERAL_NAME = 'Genel';

    // Temporary product aggregation maps per shelf
    const perShelfAgg = new Map<string, Map<string, { units: number; sets: number }>>();

    const addAgg = (shelfId: string, productId: string, du: number, ds: number) => {
      if (!perShelfAgg.has(shelfId)) perShelfAgg.set(shelfId, new Map());
      const prodMap = perShelfAgg.get(shelfId)!;
      const cur = prodMap.get(productId) || { units: 0, sets: 0 };
      cur.units += du;
      cur.sets += ds;
      prodMap.set(productId, cur);
    };

    // 2) Apply movements (so product can appear in multiple shelves)
    for (const m of movements || []) {
      // Skip deleted rows (handle both null/undefined)
      const isDeleted = (m as any).is_deleted === true;
      if (isDeleted) continue;

      const productId = (m as any).product_id ?? (m as any).productId;
      if (!productId) continue;

      const movementType: 'giris' | 'cikis' =
        ((m as any).movement_type ?? (m as any).type) as any;

      const qty = Number((m as any).quantity ?? 0) || 0;
      const setQty = Number((m as any).set_quantity ?? (m as any).setQuantity ?? 0) || 0;

      const sign = movementType === 'cikis' ? -1 : 1;

      const shelfId = (m as any).shelf_id ?? (m as any).shelfId;
      const shelfName =
        (m as any)?.shelves?.name ??
        (m as any)?.shelfName ??
        null;

      if (shelfId) {
        // Ensure shelf exists even if it was created recently and not yet in dbShelves state
        ensureShelf(shelfId, shelfName || 'Raf');
        addAgg(shelfId, productId, sign * qty, sign * setQty);
      } else {
        // No shelf: keep it in "Genel"
        ensureShelf(GENERAL_ID, GENERAL_NAME);
        addAgg(GENERAL_ID, productId, sign * qty, sign * setQty);
      }
    }

    // 3) Convert aggregation to ShelfViewModel.products
    for (const [shelfId, prodMap] of perShelfAgg.entries()) {
      const shelf = shelfMap.get(shelfId) || ensureShelf(shelfId, 'Raf');

      const rows: ShelfProductRow[] = [];
      for (const [productId, agg] of prodMap.entries()) {
        // Show only non-zero totals
        if (agg.units === 0 && agg.sets === 0) continue;

        const p = productById.get(productId);
        rows.push({
          productId,
          urunAdi: p?.urunAdi || 'Bilinmeyen Ürün',
          urunKodu: p?.urunKodu || '',
          barkod: (p as any)?.barkod || null,
          units: agg.units,
          sets: agg.sets,
        });
      }

      // Sort products by name
      rows.sort((a, b) => a.urunAdi.localeCompare(b.urunAdi, 'tr'));
      shelf.products = rows;
    }

    // 4) Build final list in DB order + keep Genel last
    const ordered: ShelfViewModel[] = [];

    // keep the same order as dbShelves
    for (const s of dbShelves) {
      const vm = shelfMap.get(s.id);
      if (vm) ordered.push(vm);
    }

    // add shelves that appeared only from movements (newly created, not in dbShelves yet)
    for (const [id, vm] of shelfMap.entries()) {
      const exists = ordered.some(x => x.shelfId === id);
      if (!exists && id !== GENERAL_ID) ordered.push(vm);
    }

    // add Genel last (only if it exists)
    if (shelfMap.has(GENERAL_ID)) ordered.push(shelfMap.get(GENERAL_ID)!);

    return ordered;
  }, [products, movements, dbShelves]);

  const filtered = useMemo(() => {
    const q = norm(searchQuery);
    if (!q) return viewModels;

    return viewModels.filter(s => {
      if (norm(s.shelfName).includes(q)) return true;
      return s.products.some(p =>
        norm(p.urunAdi).includes(q) ||
        norm(p.urunKodu).includes(q) ||
        norm(p.barkod || '').includes(q)
      );
    });
  }, [viewModels, searchQuery]);

  return (
    <div className="space-y-4">
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
            Raf bulunamadı (arama filtresini kontrol edin)
          </CardContent>
        </Card>
      ) : (
        filtered.map((shelf) => (
          <Card key={shelf.shelfId} className="overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {shelf.shelfName}
                <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {shelf.products.length}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0 pb-3">
              {shelf.products.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  Bu raf boş
                </div>
              ) : (
                <div className="space-y-2">
                  {shelf.products.map((p) => (
                    <button
                      key={p.productId}
                      onClick={() => onViewProduct(p.productId)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-muted/40 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.urunAdi}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {p.urunKodu}{p.barkod ? ` • ${p.barkod}` : ''}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-semibold">{p.units} adet</div>
                          <div className="text-xs text-muted-foreground">{p.sets} set</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}