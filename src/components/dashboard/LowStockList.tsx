import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Product } from '@/types/stock';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LowStockListProps {
  products: Product[];
  onViewProduct: (id: string) => void;
}

export function LowStockList({ products, onViewProduct }: LowStockListProps) {
  return (
    <Card className="border-destructive/20 bg-destructive/[0.02] shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <span className="block">Düşük Stok Uyarıları</span>
            <span className="text-xs font-normal text-muted-foreground">
              {products.length} ürün minimum stok seviyesinin altında
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {products.slice(0, 6).map((product, index) => (
            <button
              key={product.id}
              onClick={() => onViewProduct(product.id)}
              className="flex items-center justify-between p-3 rounded-lg bg-card hover:bg-muted/50 transition-all duration-200 text-left border border-border/60 hover:border-border hover:shadow-sm group animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {product.urunAdi}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{product.urunKodu}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">
                    {product.mevcutStok}/{product.minStok}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
        
        {products.length > 6 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" className="text-xs">
              Tümünü Görüntüle ({products.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
