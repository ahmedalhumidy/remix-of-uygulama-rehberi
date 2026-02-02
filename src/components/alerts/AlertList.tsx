import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Package, MapPin, TrendingDown, ChevronRight } from 'lucide-react';
import { Product } from '@/types/stock';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AlertListProps {
  products: Product[];
  searchQuery: string;
  onStockAction: (product: Product, type: 'giris' | 'cikis') => void;
  onViewProduct: (id: string) => void;
}

export function AlertList({ products, searchQuery, onStockAction, onViewProduct }: AlertListProps) {
  // Safari'de (özellikle mobilde) büyük listeler beyaz ekrana/yeniden yüklemeye sebep olabiliyor.
  // Bu yüzden uyarıları da parça parça render ediyoruz.
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.mevcutStok < p.minStok),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return lowStockProducts.filter((product) => (
      product.urunAdi.toLowerCase().includes(query) ||
      product.urunKodu.toLowerCase().includes(query) ||
      product.rafKonum.toLowerCase().includes(query)
    ));
  }, [lowStockProducts, searchQuery]);

  // Sort by urgency (how far below minimum)
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const aRatio = a.mevcutStok / a.minStok;
      const bRatio = b.mevcutStok / b.minStok;
      return aRatio - bRatio;
    });
  }, [filteredProducts]);

  const visibleProducts = useMemo(
    () => sortedProducts.slice(0, visibleCount),
    [sortedProducts, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, PAGE_SIZE]);

  const getUrgencyLevel = (current: number, min: number): 'critical' | 'warning' | 'low' => {
    const ratio = current / min;
    if (ratio <= 0.2) return 'critical';
    if (ratio <= 0.5) return 'warning';
    return 'low';
  };

  const urgencyStyles = {
    critical: 'border-l-4 border-l-destructive bg-destructive/5',
    warning: 'border-l-4 border-l-warning bg-warning/5',
    low: 'border-l-4 border-l-info bg-info/5',
  };

  const urgencyBadgeStyles = {
    critical: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning/10 text-warning',
    low: 'bg-info/10 text-info',
  };

  const urgencyLabels = {
    critical: 'Kritik',
    warning: 'Uyarı',
    low: 'Düşük',
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Summary */}
      <div className="stat-card bg-destructive/5 border-destructive/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/10">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{lowStockProducts.length} Ürün Uyarısı</h2>
            <p className="text-muted-foreground">Bu ürünlerin stokları minimum seviyenin altında</p>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {visibleProducts.map((product, index) => {
          const urgency = getUrgencyLevel(product.mevcutStok, product.minStok);
          const shortage = product.minStok - product.mevcutStok;
          const delay = index < 20 ? index * 30 : 0;

          return (
            <div 
              key={product.id} 
              className={cn(
                'stat-card animate-slide-up',
                urgencyStyles[urgency]
              )}
              style={delay ? { animationDelay: `${delay}ms` } : undefined}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-muted">
                    <Package className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{product.urunAdi}</h3>
                      <span className={cn('badge-status', urgencyBadgeStyles[urgency])}>
                        {urgencyLabels[urgency]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{product.urunKodu}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{product.rafKonum}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <span className="text-2xl font-bold text-destructive">{product.mevcutStok}</span>
                    <span className="text-muted-foreground">/ {product.minStok}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {shortage} adet eksik
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <Button
                  size="sm"
                  className="gradient-success border-0"
                  onClick={() => onStockAction(product, 'giris')}
                >
                  + Stok Ekle
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewProduct(product.id)}
                  className="gap-1"
                >
                  Detaylar
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {sortedProducts.length > 0 && sortedProducts.length > visibleCount && (
        <div className="stat-card">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Gösterilen: <span className="font-medium text-foreground">{visibleProducts.length}</span> / {sortedProducts.length}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, sortedProducts.length))}
            >
              Daha fazla yükle
            </Button>
          </div>
        </div>
      )}

      {sortedProducts.length === 0 && lowStockProducts.length === 0 && (
        <div className="stat-card text-center py-12 bg-success/5 border-success/20">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Tüm Stoklar Yeterli</h3>
          <p className="text-muted-foreground">Hiçbir ürün minimum stok seviyesinin altında değil.</p>
        </div>
      )}

      {sortedProducts.length === 0 && lowStockProducts.length > 0 && (
        <div className="stat-card text-center py-12">
          <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Sonuç bulunamadı</h3>
          <p className="text-muted-foreground">Arama kriterlerinize uygun uyarı yok.</p>
        </div>
      )}
    </div>
  );
}
