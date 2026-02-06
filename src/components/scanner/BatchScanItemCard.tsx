import {
  Package, Check, AlertTriangle, Trash2,
  Plus, Minus, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import { Product } from '@/types/stock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface BatchScanItem {
  id: string;
  barcode: string;
  product: Product | null;
  quantity: number;
  setQuantity: number;
  type: 'giris' | 'cikis';
  status: 'pending' | 'success' | 'error' | 'not_found';
  scanCount: number;
  scannedAt: Date;
}

interface BatchScanItemCardProps {
  item: BatchScanItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateItem: (id: string, updates: Partial<BatchScanItem>) => void;
  onRemoveItem: (id: string) => void;
  onQuickAdd?: (barcode: string) => void;
}

export function BatchScanItemCard({
  item,
  isExpanded,
  onToggleExpand,
  onUpdateItem,
  onRemoveItem,
  onQuickAdd,
}: BatchScanItemCardProps) {
  const isFound = !!item.product;
  const isProcessed = item.status === 'success' || item.status === 'error';

  const statusConfig = {
    pending: {
      bg: 'bg-amber-500/10 border-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-600',
      label: 'Bekliyor',
    },
    success: {
      bg: 'bg-success/5 border-success/20',
      badge: 'bg-success/10 text-success',
      label: 'Tamamlandı',
    },
    error: {
      bg: 'bg-destructive/5 border-destructive/20',
      badge: 'bg-destructive/10 text-destructive',
      label: 'Hata',
    },
    not_found: {
      bg: 'bg-muted border-border',
      badge: 'bg-muted text-muted-foreground',
      label: 'Bulunamadı',
    },
  };

  const cfg = statusConfig[item.status];

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all',
        cfg.bg,
        isProcessed && 'opacity-70'
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
            item.status === 'success'
              ? 'bg-success/20'
              : item.status === 'error'
              ? 'bg-destructive/20'
              : item.status === 'not_found'
              ? 'bg-muted'
              : 'bg-primary/10'
          )}
        >
          {item.status === 'success' ? (
            <Check className="w-4 h-4 text-success" />
          ) : item.status === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          ) : (
            <Package className="w-4 h-4 text-primary" />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground truncate">
              {item.product?.urunAdi || 'Bilinmeyen Ürün'}
            </span>
            {item.scanCount > 1 && (
              <Badge variant="secondary" className="text-xs shrink-0">
                x{item.scanCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono text-muted-foreground">
              {item.barcode}
            </span>
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', cfg.badge)}>
              {cfg.label}
            </Badge>
          </div>
        </div>

        {/* Quantity + Expand */}
        <div className="flex items-center gap-2 shrink-0">
          {isFound && !isProcessed && (
            <div className="flex items-center gap-1 bg-background rounded-md border border-border">
              <button
                className="p-1.5 hover:bg-muted rounded-l-md transition-colors"
                onClick={() =>
                  onUpdateItem(item.id, {
                    quantity: Math.max(1, item.quantity - 1),
                  })
                }
              >
                <Minus className="w-3 h-3" />
              </button>
              <Input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  onUpdateItem(item.id, {
                    quantity: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="w-12 h-8 text-center border-0 px-0 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                className="p-1.5 hover:bg-muted rounded-r-md transition-colors"
                onClick={() =>
                  onUpdateItem(item.id, { quantity: item.quantity + 1 })
                }
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}

          {isFound && !isProcessed && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}

          {!isFound && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => onQuickAdd?.(item.barcode)}
            >
              <Plus className="w-3 h-3" />
              Ekle
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Options */}
      {isExpanded && isFound && !isProcessed && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-3 animate-slide-up">
          {/* Type Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-14">İşlem:</span>
            <div className="flex gap-1 flex-1">
              <Button
                size="sm"
                variant={item.type === 'giris' ? 'default' : 'outline'}
                className={cn(
                  'flex-1 h-8 text-xs',
                  item.type === 'giris' &&
                    'bg-success hover:bg-success/90 text-success-foreground'
                )}
                onClick={() => onUpdateItem(item.id, { type: 'giris' })}
              >
                <Plus className="w-3 h-3 mr-1" />
                Giriş
              </Button>
              <Button
                size="sm"
                variant={item.type === 'cikis' ? 'default' : 'outline'}
                className={cn(
                  'flex-1 h-8 text-xs',
                  item.type === 'cikis' &&
                    'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                )}
                onClick={() => onUpdateItem(item.id, { type: 'cikis' })}
              >
                <Minus className="w-3 h-3 mr-1" />
                Çıkış
              </Button>
            </div>
          </div>

          {/* Set Quantity */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-14">Set:</span>
            <Input
              type="number"
              min={0}
              value={item.setQuantity || ''}
              onChange={(e) =>
                onUpdateItem(item.id, {
                  setQuantity: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              placeholder="0"
              className="h-8 text-sm flex-1"
            />
          </div>

          {/* Product Stock Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5">
            <span>
              Mevcut: <strong className="text-foreground">{item.product?.mevcutStok}</strong>
            </span>
            <span>
              Set: <strong className="text-foreground">{item.product?.setStok || 0}</strong>
            </span>
            <span>
              Raf: <strong className="text-foreground">{item.product?.rafKonum}</strong>
            </span>
          </div>

          {/* Remove Button */}
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemoveItem(item.id)}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Kaldır
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
