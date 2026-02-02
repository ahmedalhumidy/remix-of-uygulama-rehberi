import { Search, Plus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanButton } from '@/components/scanner/ScanButton';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Product } from '@/types/stock';
import { usePermissions } from '@/hooks/usePermissions';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddProduct: () => void;
  alertCount: number;
  onMobileMenuToggle: () => void;
  products: Product[];
  onProductFound: (product: Product) => void;
  onBarcodeNotFound: (barcode: string) => void;
}

export function Header({ 
  searchQuery, 
  onSearchChange, 
  onAddProduct, 
  alertCount,
  onMobileMenuToggle,
  products,
  onProductFound,
  onBarcodeNotFound,
}: HeaderProps) {
  const { hasPermission } = usePermissions();
  const canCreateProducts = hasPermission('products.create');

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Ürün ara (kod, isim, konum)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input-search"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Barcode Scanner */}
          <ScanButton 
            products={products}
            onProductFound={onProductFound}
            onBarcodeNotFound={onBarcodeNotFound}
          />

          {/* Notification Center */}
          <NotificationCenter />

          {/* Add Product - Permission Based */}
          {canCreateProducts && (
            <Button onClick={onAddProduct} className="gap-2 gradient-accent border-0 hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Yeni Ürün</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
