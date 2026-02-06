import { useState, lazy, Suspense } from 'react';
import { ScanBarcode, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/stock';
import { useScanSessionSettings } from '../hooks/useScanSessionSettings';
import { ScanSessionMode } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ScanSessionModal = lazy(() =>
  import('./ScanSessionModal').then(m => ({ default: m.ScanSessionModal }))
);

interface ScanSessionLauncherProps {
  products: Product[];
  onStockUpdated?: () => void;
  /** If set, pre-fill session with this product */
  prefillProduct?: Product;
  /** Show as icon-only button */
  compact?: boolean;
  /** Label override */
  label?: string;
}

export function ScanSessionLauncher({
  products,
  onStockUpdated,
  prefillProduct,
  compact = false,
  label,
}: ScanSessionLauncherProps) {
  const { isEnabled } = useScanSessionSettings();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ScanSessionMode>('in');

  if (!isEnabled) return null;

  const handleOpen = (m: ScanSessionMode) => {
    setMode(m);
    setOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size={compact ? 'icon' : 'default'}
            className={compact ? 'h-9 w-9' : 'gap-2'}
          >
            <Layers className="w-4 h-4" />
            {!compact && (label || 'Tarama Oturumu')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => handleOpen('in')} className="gap-2 py-3">
            <span className="text-emerald-500 font-bold text-lg">↓</span>
            Stok Girişi (IN)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpen('out')} className="gap-2 py-3">
            <span className="text-red-500 font-bold text-lg">↑</span>
            Stok Çıkışı (OUT)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleOpen('transfer')} className="gap-2 py-3">
            <span className="text-blue-500 font-bold text-lg">⇄</span>
            Transfer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpen('count')} className="gap-2 py-3">
            <span className="text-amber-500 font-bold text-lg">#</span>
            Sayım (Count)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {open && (
        <Suspense fallback={null}>
          <ScanSessionModal
            isOpen={open}
            onClose={() => setOpen(false)}
            products={products}
            initialMode={mode}
            prefillProduct={prefillProduct}
            onStockUpdated={onStockUpdated}
          />
        </Suspense>
      )}
    </>
  );
}
