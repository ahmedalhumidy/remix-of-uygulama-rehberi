import { Check, X, AlertTriangle, RotateCcw, LogOut, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BatchScanItem } from './BatchScanItemCard';
import { cn } from '@/lib/utils';

interface BatchScanSummaryProps {
  items: BatchScanItem[];
  onNewSession: () => void;
  onFinish: () => void;
}

export function BatchScanSummary({ items, onNewSession, onFinish }: BatchScanSummaryProps) {
  const successItems = items.filter((i) => i.status === 'success');
  const errorItems = items.filter((i) => i.status === 'error');
  const notFoundItems = items.filter((i) => i.status === 'not_found');
  const pendingItems = items.filter((i) => i.status === 'pending');

  const totalProcessed = successItems.length + errorItems.length;
  const totalQuantity = successItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalSets = successItems.reduce((sum, i) => sum + i.setQuantity, 0);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card safe-area-top">
        <h2 className="font-semibold text-foreground">Tarama Özeti</h2>
        <Button variant="ghost" size="sm" onClick={onFinish}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Summary Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Hero Stat */}
        <div className="text-center py-6">
          <div
            className={cn(
              'w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center',
              errorItems.length === 0 ? 'bg-success/10' : 'bg-destructive/10'
            )}
          >
            {errorItems.length === 0 ? (
              <Check className="w-8 h-8 text-success" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-destructive" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            {successItems.length}/{totalProcessed}
          </h3>
          <p className="text-sm text-muted-foreground">İşlem başarıyla tamamlandı</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-center">
            <p className="text-2xl font-bold text-success">{totalQuantity}</p>
            <p className="text-xs text-muted-foreground">Toplam Adet</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalSets}</p>
            <p className="text-xs text-muted-foreground">Toplam Set</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Detay</h4>

          {successItems.length > 0 && (
            <div className="rounded-lg border border-success/20 bg-success/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">
                  Başarılı ({successItems.length})
                </span>
              </div>
              <div className="space-y-1">
                {successItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-foreground truncate">
                      {item.product?.urunAdi}
                    </span>
                    <span className="text-muted-foreground shrink-0 ml-2">
                      {item.type === 'giris' ? '+' : '−'}{item.quantity} adet
                      {item.setQuantity > 0 && `, ${item.setQuantity} set`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorItems.length > 0 && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <X className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Başarısız ({errorItems.length})
                </span>
              </div>
              <div className="space-y-1">
                {errorItems.map((item) => (
                  <div key={item.id} className="text-xs text-muted-foreground">
                    {item.product?.urunAdi || item.barcode}
                  </div>
                ))}
              </div>
            </div>
          )}

          {notFoundItems.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Bulunamadı ({notFoundItems.length})
                </span>
              </div>
              <div className="space-y-1">
                {notFoundItems.map((item) => (
                  <div
                    key={item.id}
                    className="text-xs font-mono text-muted-foreground"
                  >
                    {item.barcode}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-border bg-card px-4 py-3 safe-area-bottom">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex-1 h-11 gap-2"
            onClick={onNewSession}
          >
            <RotateCcw className="w-4 h-4" />
            Yeni Tarama
          </Button>
          <Button className="flex-1 h-11 gap-2" onClick={onFinish}>
            <LogOut className="w-4 h-4" />
            Kapat
          </Button>
        </div>
      </div>
    </div>
  );
}
