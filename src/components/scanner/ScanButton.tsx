import { Suspense, lazy, useState, useCallback } from 'react';
import { ScanBarcode, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/stock';
import { toast } from 'sonner';
import { BarcodeResultModal } from './BarcodeResultModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LazyBarcodeScanner = lazy(() => import('./BarcodeScanner').then(m => ({ default: m.BarcodeScanner })));
const LazyBatchScanSession = lazy(() => import('./BatchScanSession').then(m => ({ default: m.BatchScanSession })));

interface ScanButtonProps {
  products: Product[];
  onProductFound: (product: Product) => void;
  onBarcodeNotFound: (barcode: string) => void;
  onStockUpdated?: () => void;
}

export function ScanButton({ products, onProductFound, onBarcodeNotFound, onStockUpdated }: ScanButtonProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  const handleScan = useCallback((code: string) => {
    // Search by barcode or product code
    const product = products.find(
      (p) => p.barkod === code || p.urunKodu === code
    );

    setScannedBarcode(code);
    setScannedProduct(product || null);
    setResultModalOpen(true);

    if (product) {
      toast.success(`Ürün bulundu: ${product.urunAdi}`);
    } else {
      toast.info(`Barkod bulunamadı: ${code}`);
    }
  }, [products]);

  const handleResultClose = () => {
    setResultModalOpen(false);
    setScannedProduct(null);
    setScannedBarcode(null);
  };

  const handleAddNewProduct = (barcode: string) => {
    handleResultClose();
    onBarcodeNotFound(barcode);
  };

  const handleStockSuccess = () => {
    onStockUpdated?.();
    handleResultClose();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary"
          >
            <ScanBarcode className="w-4 h-4" />
            <span className="hidden sm:inline">Barkod</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => setScannerOpen(true)} className="gap-2">
            <ScanBarcode className="w-4 h-4" />
            Tekli Tarama
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setBatchOpen(true)} className="gap-2">
            <Layers className="w-4 h-4" />
            Toplu Tarama (Batch)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Single scan */}
      {scannerOpen && (
        <Suspense fallback={null}>
          <LazyBarcodeScanner
            isOpen={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onScan={handleScan}
          />
        </Suspense>
      )}

      {/* Batch scan */}
      {batchOpen && (
        <Suspense fallback={null}>
          <LazyBatchScanSession
            isOpen={batchOpen}
            onClose={() => setBatchOpen(false)}
            products={products}
            onStockUpdated={onStockUpdated}
            onAddNewProduct={(barcode) => {
              setBatchOpen(false);
              onBarcodeNotFound(barcode);
            }}
          />
        </Suspense>
      )}

      {/* Quick stock action modal after barcode scan */}
      <BarcodeResultModal
        isOpen={resultModalOpen}
        onClose={handleResultClose}
        product={scannedProduct}
        barcode={scannedBarcode}
        onAddNewProduct={handleAddNewProduct}
        onStockUpdated={handleStockSuccess}
      />
    </>
  );
}
