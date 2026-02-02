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
import { UserManagement } from '@/components/users/UserManagement';
import { AuditLogList } from '@/components/users/AuditLogList';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { Product, ViewMode } from '@/types/stock';
import { useProducts } from '@/hooks/useProducts';
import { useMovements } from '@/hooks/useMovements';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentView } from '@/hooks/useCurrentView';
import { cn } from '@/lib/utils';
import { X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Index = () => {
  const { signOut, user } = useAuth();
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct, refreshProducts } = useProducts();
  const { movements, loading: movementsLoading, addMovement, refreshMovements } = useMovements(products);
  
  const { currentView, setCurrentView } = useCurrentView();
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSaveProduct = async (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData) {
      await updateProduct(productData);
    } else {
      await addProduct(productData);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
  };

  const handleStockAction = (product: Product, type: 'giris' | 'cikis') => {
    setSelectedProduct(product);
    setStockActionType(type);
    setStockActionModalOpen(true);
  };

  const handleStockActionConfirm = async (quantity: number, note: string) => {
    if (!selectedProduct) return;

    await addMovement({
      productId: selectedProduct.id,
      type: stockActionType,
      quantity,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      note: note || undefined,
    });

    // Refresh products to get updated stock
    refreshProducts();
  };

  const handleAddMovement = async (data: {
    productId: string;
    type: 'giris' | 'cikis';
    quantity: number;
    date: string;
    time: string;
    note?: string;
  }) => {
    await addMovement(data);
    refreshProducts();
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
    setSelectedProduct(null);
    setProductModalOpen(true);
  };

  const handleAddNewProductFromMovement = (barcode: string) => {
    setSelectedProduct(null);
    setProductModalOpen(true);
    toast.info('Yeni ürün ekleyin', {
      description: `Barkod: ${barcode} - Lütfen ürün bilgilerini doldurun`,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Çıkış yapıldı');
  };

  const viewTitles: Record<ViewMode, string> = {
    dashboard: 'Kontrol Paneli',
    products: 'Ürün Yönetimi',
    movements: 'Stok Hareketleri',
    locations: 'Konum Yönetimi',
    alerts: 'Stok Uyarıları',
    users: 'Kullanıcı Yönetimi',
    logs: 'Denetim Günlüğü',
    profile: 'Profil Ayarları',
  };

  const isLoading = productsLoading || movementsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar */}
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

      {/* Desktop Sidebar */}
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
          {/* Page Title with Sign Out */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{viewTitles[currentView]}</h1>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış
            </Button>
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

          {currentView === 'users' && (
            <UserManagement />
          )}

          {currentView === 'logs' && (
            <AuditLogList />
          )}

          {currentView === 'profile' && (
            <ProfileSettings />
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
