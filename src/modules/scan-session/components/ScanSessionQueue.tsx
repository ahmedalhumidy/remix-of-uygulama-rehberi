import { Plus, Minus, Trash2, AlertTriangle, PlusCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScanQueueItem, ScanTarget, ScanSessionMode } from '../types';
import { Product } from '@/types/stock';
import { cn } from '@/lib/utils';

interface ScanSessionQueueProps {
  items: ScanQueueItem[];
  scanTarget: ScanTarget;
  allowNegativeStock: boolean;
  mode: ScanSessionMode;
  products: Product[];
  onUpdateItem: (id: string, updates: Partial<ScanQueueItem>) => void;
  onRemoveItem: (id: string) => void;
  onQuickAdd: (itemId: string, barcode: string) => void;
}

export function ScanSessionQueue({
  items,
  scanTarget,
  allowNegativeStock,
  mode,
  products,
  onUpdateItem,
  onRemoveItem,
  onQuickAdd,
}: ScanSessionQueueProps) {
  return (
    <div className="divide-y">
      {items.map(item => {
        const product = item.productId ? products.find(p => p.id === item.productId) : null;
        const wouldGoNegative = mode === 'out' && product && item.units > product.mevcutStok;

        return (
          <div
            key={item.id}
            className={cn(
              'px-3 py-2.5 flex items-start gap-3',
              item.status === 'not_found' && 'bg-amber-500/5',
              item.status === 'processed' && 'bg-emerald-500/5 opacity-60',
              item.status === 'error' && 'bg-red-500/5',
            )}
          >
            {/* Product info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {item.status === 'not_found' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                ) : item.status === 'processed' ? (
                  <Package className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium text-sm truncate">
                  {item.productName || item.barcode}
                </span>
              </div>

              {item.productCode && (
                <p className="text-xs text-muted-foreground mt-0.5 ml-5.5">
                  {item.productCode} {item.shelfName && `• ${item.shelfName}`}
                </p>
              )}

              {item.status === 'not_found' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1.5 h-7 text-xs gap-1 ml-5.5 border-amber-500/30 text-amber-600"
                  onClick={() => onQuickAdd(item.id, item.barcode)}
                >
                  <PlusCircle className="w-3 h-3" />
                  Ürün Ekle
                </Button>
              )}

              {item.status === 'error' && item.errorMessage && (
                <p className="text-xs text-destructive mt-1 ml-5.5">{item.errorMessage}</p>
              )}

              {wouldGoNegative && !allowNegativeStock && (
                <p className="text-xs text-amber-600 mt-1 ml-5.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Stok: {product?.mevcutStok} — negatife düşer
                </p>
              )}
            </div>

            {/* Qty controls */}
            {(item.status === 'pending' || item.status === 'not_found') && item.productId && (
              <div className="flex flex-col gap-1 shrink-0 items-end">
                {/* Units */}
                {(scanTarget === 'units' || scanTarget === 'both') && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground w-8">Adet</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateItem(item.id, { units: Math.max(0, item.units - 1) })}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.units}
                      onChange={e => onUpdateItem(item.id, { units: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-14 h-7 text-center text-sm px-1"
                      min={0}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateItem(item.id, { units: item.units + 1 })}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Sets */}
                {(scanTarget === 'sets' || scanTarget === 'both') && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground w-8">Set</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateItem(item.id, { sets: Math.max(0, item.sets - 1) })}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.sets}
                      onChange={e => onUpdateItem(item.id, { sets: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-14 h-7 text-center text-sm px-1"
                      min={0}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateItem(item.id, { sets: item.sets + 1 })}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Remove */}
            {item.status !== 'processed' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onRemoveItem(item.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
