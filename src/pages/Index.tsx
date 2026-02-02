import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ProductList } from '@/components/products/ProductList';
import { ProductModal } from '@/components/products/ProductModal';
import { StockActionModal } from '@/components/products/StockActionModal';
import { MovementPage } from '@/components/movements/MovementPage';
import { LocationView } from '@/components/locations/LocationView';
import { AlertList } from '@/components/alerts/AlertList';
import { Product, StockMovement, ViewMode } from '@/types/stock';
import { initialProducts, initialMovements } from '@/data/stockData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockActionModalOpen, setStockActionModalOpen] = useState(false);
  const [stockActionType, setStockActionType] = useState<'giris' | 'cikis'>('giris');

  const lowStockCount = products.filter(p => p.mevcutStok < p.minStok).length;

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const handleSaveProduct = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData) {
      // Update existing
      setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
      toast.success('Ürün güncellendi');
    } else {
      // Add new
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
      };
      setProducts(prev => [...prev, newProduct]);
      toast.success('Yeni ürün eklendi');
    }
  };

  const handleDeleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success(`${product?.urunAdi || 'Ürün'} silindi`);
  };

  const handleStockAction = (product: Product, type: 'giris' | 'cikis') => {
    setSelectedProduct(product);
    setStockActionType(type);
    setStockActionModalOpen(true);
  };

  const handleStockActionConfirm = (quantity: number, note: string) => {
    if (!selectedProduct) return;

    // Update product stock
    const newStock = stockActionType === 'giris' 
      ? selectedProduct.mevcutStok + quantity 
      : selectedProduct.mevcutStok - quantity;

    setProducts(prev => prev.map(p => 
      p.id === selectedProduct.id 
        ? { 
            ...p, 
            mevcutStok: newStock,
            toplamGiris: stockActionType === 'giris' ? p.toplamGiris + quantity : p.toplamGiris,
            toplamCikis: stockActionType === 'cikis' ? p.toplamCikis + quantity : p.toplamCikis,
            uyari: newStock < p.minStok,
            sonIslemTarihi: new Date().toISOString().split('T')[0],
          } 
        : p
    ));

    // Add movement record
    const newMovement: StockMovement = {
      id: Date.now().toString(),
      productId: selectedProduct.id,
      productName: selectedProduct.urunAdi,
      type: stockActionType,
      quantity,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      handledBy: 'Kullanıcı',
      note: note || undefined,
    };
    setMovements(prev => [newMovement, ...prev]);

    toast.success(
      stockActionType === 'giris' 
        ? `${quantity} adet stok girişi yapıldı` 
        : `${quantity} adet stok çıkışı yapıldı`
    );
  };

  const handleAddMovement = (data: {
    productId: string;
    type: 'giris' | 'cikis';
    quantity: number;
    date: string;
    time: string;
    handledBy: string;
    note?: string;
  }) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    // Update product stock
    const newStock = data.type === 'giris' 
      ? product.mevcutStok + data.quantity 
      : product.mevcutStok - data.quantity;

    setProducts(prev => prev.map(p => 
      p.id === data.productId 
        ? { 
            ...p, 
            mevcutStok: newStock,
            toplamGiris: data.type === 'giris' ? p.toplamGiris + data.quantity : p.toplamGiris,
            toplamCikis: data.type === 'cikis' ? p.toplamCikis + data.quantity : p.toplamCikis,
            uyari: newStock < p.minStok,
            sonIslemTarihi: data.date,
          } 
        : p
    ));

    // Add movement record
    const newMovement: StockMovement = {
      id: Date.now().toString(),
      productId: data.productId,
      productName: product.urunAdi,
      type: data.type,
      quantity: data.quantity,
      date: data.date,
      time: data.time,
      handledBy: data.handledBy,
      note: data.note,
    };
    setMovements(prev => [newMovement, ...prev]);

    toast.success(
      data.type === 'giris' 
        ? `${data.quantity} adet stok girişi yapıldı` 
        : `${data.quantity} adet stok çıkışı yapıldı`
    );
  };

  const handleViewProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setSelectedProduct(product);
      setProductModalOpen(true);
    }
  };

  const handleScanProductFound = (product: Product) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const handleScanBarcodeNotFound = (barcode: string) => {
    // Open new product modal with barcode pre-filled
    setSelectedProduct(null);
    setProductModalOpen(true);
    // The barcode will be shown in toast, user can add it manually
  };

  const handleAddNewProductFromMovement = (barcode: string) => {
    // Open new product modal with barcode pre-filled from movement page
    setSelectedProduct(null);
    setProductModalOpen(true);
    toast.info('Yeni ürün ekleyin', {
      description: `Barkod: ${barcode} - Lütfen ürün bilgilerini doldurun`,
    });
  };

  const viewTitles: Record<ViewMode, string> = {
    dashboard: 'Kontrol Paneli',
    products: 'Ürün Yönetimi',
    movements: 'Stok Hareketleri',
    locations: 'Konum Yönetimi',
    alerts: 'Stok Uyarıları',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden transition-opacity duration-300',
        mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}>
        <div 
          className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className={cn(
          'relative h-full w-64 transition-transform duration-300',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <Sidebar 
            currentView={currentView} 
            onViewChange={(view) => {
              setCurrentView(view);
              setMobileMenuOpen(false);
            }} 
            alertCount={lowStockCount}
          />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-sidebar-accent text-sidebar-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="hidden lg:block">
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          alertCount={lowStockCount}
        />
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        <Header 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddProduct={handleAddProduct}
          alertCount={lowStockCount}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          products={products}
          onProductFound={handleScanProductFound}
          onBarcodeNotFound={handleScanBarcodeNotFound}
        />

        <main className="p-4 md:p-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">{viewTitles[currentView]}</h1>
          </div>

          {/* Content */}
          {currentView === 'dashboard' && (
            <Dashboard 
              products={products} 
              movements={movements}
              onViewProduct={handleViewProduct}
            />
          )}

          {currentView === 'products' && (
            <ProductList 
              products={products}
              searchQuery={searchQuery}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onViewProduct={handleViewProduct}
              onStockAction={handleStockAction}
            />
          )}

          {currentView === 'movements' && (
            <MovementPage 
              products={products}
              movements={movements}
              searchQuery={searchQuery}
              onAddMovement={handleAddMovement}
              onAddNewProduct={handleAddNewProductFromMovement}
            />
          )}

          {currentView === 'locations' && (
            <LocationView 
              products={products}
              searchQuery={searchQuery}
              onViewProduct={handleViewProduct}
            />
          )}

          {currentView === 'alerts' && (
            <AlertList 
              products={products}
              searchQuery={searchQuery}
              onStockAction={handleStockAction}
              onViewProduct={handleViewProduct}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ProductModal 
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleSaveProduct}
        product={selectedProduct}
      />

      <StockActionModal 
        isOpen={stockActionModalOpen}
        onClose={() => {
          setStockActionModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleStockActionConfirm}
        product={selectedProduct}
        actionType={stockActionType}
      />
    </div>
  );
};

export default Index;
