import { useState } from 'react';
import { ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarcodeScanner } from './BarcodeScanner';
import { Product } from '@/types/stock';
import { toast } from 'sonner';

interface ScanButtonProps {
  products: Product[];
  onProductFound: (product: Product) => void;
  onBarcodeNotFound: (barcode: string) => void;
}

export function ScanButton({ products, onProductFound, onBarcodeNotFound }: ScanButtonProps) {
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleScan = (code: string) => {
    // Search by barcode or product code
    const product = products.find(
      (p) => p.barkod === code || p.urunKodu === code
    );

    if (product) {
      toast.success(`Ürün bulundu: ${product.urunAdi}`);
      onProductFound(product);
    } else {
      toast.error(`Barkod bulunamadı: ${code}`);
      onBarcodeNotFound(code);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setScannerOpen(true)}
        className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary"
      >
        <ScanBarcode className="w-4 h-4" />
        <span className="hidden sm:inline">Barkod Tara</span>
      </Button>

      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}
