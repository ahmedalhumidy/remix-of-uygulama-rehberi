import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Product } from '@/types/stock';
import { Button } from '@/components/ui/button';

interface LowStockListProps {
  products: Product[];
  onViewProduct: (id: string) => void;
}

export function LowStockList({ products, onViewProduct }: LowStockListProps) {
  return (
    <div className="stat-card border-destructive/20 bg-destructive/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-destructive/10">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Düşük Stok Uyarıları</h3>
          <p className="text-sm text-muted-foreground">{products.length} ürün minimum stok seviyesinin altında</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.slice(0, 6).map((product, index) => (
          <button
            key={product.id}
            onClick={() => onViewProduct(product.id)}
            className="flex items-center justify-between p-3 rounded-lg bg-card hover:bg-muted/50 transition-colors text-left animate-slide-up border border-border"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{product.urunAdi}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{product.urunKodu}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                  {product.mevcutStok}/{product.minStok}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
      
      {products.length > 6 && (
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm">
            Tümünü Görüntüle ({products.length})
          </Button>
        </div>
      )}
    </div>
  );
}
