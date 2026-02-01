import { MapPin, Package, AlertTriangle } from 'lucide-react';
import { Product } from '@/types/stock';
import { cn } from '@/lib/utils';

interface LocationViewProps {
  products: Product[];
  searchQuery: string;
  onViewProduct: (id: string) => void;
}

export function LocationView({ products, searchQuery, onViewProduct }: LocationViewProps) {
  // Group products by location
  const locationGroups = products.reduce((groups, product) => {
    const location = product.rafKonum;
    if (!groups[location]) {
      groups[location] = [];
    }
    groups[location].push(product);
    return groups;
  }, {} as Record<string, Product[]>);

  // Filter locations based on search
  const filteredLocations = Object.keys(locationGroups)
    .filter(location => {
      const query = searchQuery.toLowerCase();
      return (
        location.toLowerCase().includes(query) ||
        locationGroups[location].some(p => 
          p.urunAdi.toLowerCase().includes(query) ||
          p.urunKodu.toLowerCase().includes(query)
        )
      );
    })
    .sort();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
      {filteredLocations.map((location, index) => {
        const locationProducts = locationGroups[location];
        const totalStock = locationProducts.reduce((sum, p) => sum + p.mevcutStok, 0);
        const lowStockCount = locationProducts.filter(p => p.mevcutStok < p.minStok).length;

        return (
          <div 
            key={location} 
            className="stat-card animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{location}</h3>
                  <p className="text-sm text-muted-foreground">
                    {locationProducts.length} ürün
                  </p>
                </div>
              </div>
              {lowStockCount > 0 && (
                <span className="badge-status bg-destructive/10 text-destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {lowStockCount}
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {locationProducts.map((product) => {
                const isLowStock = product.mevcutStok < product.minStok;
                return (
                  <button
                    key={product.id}
                    onClick={() => onViewProduct(product.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{product.urunAdi}</span>
                    </div>
                    <span className={cn(
                      'text-sm font-medium ml-2 flex-shrink-0',
                      isLowStock ? 'text-destructive' : 'text-foreground'
                    )}>
                      {product.mevcutStok}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Toplam Stok</span>
              <span className="font-semibold text-foreground">{totalStock}</span>
            </div>
          </div>
        );
      })}

      {filteredLocations.length === 0 && (
        <div className="col-span-full stat-card text-center py-12">
          <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Konum bulunamadı</h3>
          <p className="text-muted-foreground">Arama kriterlerinize uygun konum yok.</p>
        </div>
      )}
    </div>
  );
}
