import { MapPin, Package } from 'lucide-react';
import { Product, StockMovement } from '@/types/stock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShelfInventory } from '@/hooks/useShelfInventory';

interface LocationViewProps {
  products: Product[];
  movements?: StockMovement[];
  searchQuery: string;
  onViewProduct: (id: string) => void;
}

export function LocationView({ products, movements = [], searchQuery, onViewProduct }: LocationViewProps) {
  const shelves = useShelfInventory(products, movements, searchQuery);

  return (
    <div className="space-y-4">
      {shelves.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
            Raf bulunamadı (arama filtresini kontrol edin)
          </CardContent>
        </Card>
      ) : (
        shelves.map((shelf) => (
          <Card key={shelf.shelfName} className="overflow-hidden">
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
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}