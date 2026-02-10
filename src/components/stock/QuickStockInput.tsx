import { useEffect, useMemo, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ShelfSelector } from '@/components/shelves/ShelfSelector';
import { useShelves, Shelf } from '@/hooks/useShelves';
import { stockService } from '@/services/stockService';
import { Product } from '@/types/stock';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickStockInputProps {
  product: Product;
  onSuccess?: () => void;
  showShelfSelector?: boolean;
  compact?: boolean;
  className?: string;
}

type ActionMode = 'idle' | 'giris' | 'cikis';

async function fetchShelfInventory(productId: string, shelfId: string) {
  const { data, error } = await supabase
    .from('shelf_inventory')
    .select('units, sets')
    .eq('product_id', productId)
    .eq('shelf_id', shelfId)
    .maybeSingle();

  if (error) throw error;

  return {
    units: Number((data as any)?.units ?? 0) || 0,
    sets: Number((data as any)?.sets ?? 0) || 0,
  };
}

export function QuickStockInput({
  product,
  onSuccess,
  showShelfSelector = true,
  compact = false,
  className
}: QuickStockInputProps) {
  const [mode, setMode] = useState<ActionMode>('idle');
  const [adetInput, setAdetInput] = useState<number>(0);
  const [setInput, setSetInput] = useState<number>(0);
  const [note, setNote] = useState('');

  const [selectedShelfId, setSelectedShelfId] = useState<string | undefined>();
  const [selectedShelfStock, setSelectedShelfStock] = useState<{ units: number; sets: number }>({ units: 0, sets: 0 });
  const [loadingShelfStock, setLoadingShelfStock] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { shelves, addShelf } = useShelves();

  // ✅ IMPORTANT: Do NOT auto-select shelf from product.rafKonum (default shelf causes mixing)
  // We keep selection empty until user chooses a shelf (professional behavior).
  useEffect(() => {
    if (!showShelfSelector) return;
    setSelectedShelfId(undefined);
    setSelectedShelfStock({ units: 0, sets: 0 });
  }, [product.id, showShelfSelector]);

  // When shelf changes => fetch real stock from shelf_inventory
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!selectedShelfId) {
        setSelectedShelfStock({ units: 0, sets: 0 });
        return;
      }
      try {
        setLoadingShelfStock(true);
        const s = await fetchShelfInventory(product.id, selectedShelfId);
        if (!cancelled) setSelectedShelfStock(s);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setSelectedShelfStock({ units: 0, sets: 0 });
          toast.error('Raf stok bilgisi alınamadı');
        }
      } finally {
        if (!cancelled) setLoadingShelfStock(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [product.id, selectedShelfId]);

  const resetForm = () => {
    setMode('idle');
    setAdetInput(0);
    setSetInput(0);
    setNote('');
  };

  const handleModeChange = (newMode: ActionMode) => {
    if (mode === newMode) {
      resetForm();
    } else {
      setMode(newMode);
      setAdetInput(0);
      setSetInput(0);
      setNote('');
    }
  };

  // Validation (per shelf)
  const isValid = () => {
    if (mode === 'idle') return false;
    if (!selectedShelfId) return false; // ✅ require shelf
    if (adetInput === 0 && setInput === 0) return false;
    if (adetInput < 0 || setInput < 0) return false;

    if (mode === 'cikis') {
      if (adetInput > selectedShelfStock.units) return false;
      if (setInput > selectedShelfStock.sets) return false;
    }

    return true;
  };

  // Preview (global preview still ok)
  const newAdet = mode === 'giris'
    ? product.mevcutStok + adetInput
    : mode === 'cikis'
      ? product.mevcutStok - adetInput
      : product.mevcutStok;

  const newSet = mode === 'giris'
    ? (product.setStok || 0) + setInput
    : mode === 'cikis'
      ? (product.setStok || 0) - setInput
      : (product.setStok || 0);

  const handleSubmit = async () => {
    if (!isValid() || !selectedShelfId) return;

    setIsSubmitting(true);

    const now = new Date();
    const result = await stockService.createMovement({
      productId: product.id,
      type: mode as 'giris' | 'cikis',
      quantity: adetInput,
      setQuantity: setInput,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      note: note || undefined,
      shelfId: selectedShelfId, // ✅ REQUIRED
    });

    setIsSubmitting(false);

    if (result) {
      resetForm();
      onSuccess?.();
    }
  };

  const handleShelfSelect = (shelf: Shelf) => {
    setSelectedShelfId(shelf.id);
  };

  const selectedShelfName = useMemo(() => {
    if (!selectedShelfId) return '';
    return shelves.find(s => s.id === selectedShelfId)?.name || '';
  }, [selectedShelfId, shelves]);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-success hover:bg-success/10 hover:text-success"
          onClick={() => handleModeChange('giris')}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => handleModeChange('cikis')}
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Top summary */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-sm">
              <span className="text-muted-foreground">Mevcut Stok:</span>
              <span className="font-bold text-lg ml-2">{product.mevcutStok}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Set:</span>
              <span className="font-bold text-lg ml-2">{product.setStok || 0}</span>
            </div>

            {/* ✅ Selected shelf real stock */}
            {showShelfSelector && (
              <div className="text-sm">
                <span className="text-muted-foreground">Seçili Raf:</span>
                <span className="font-semibold ml-2">{selectedShelfName || '—'}</span>
                <span className="text-muted-foreground ml-3">Stok:</span>
                <span className="font-semibold ml-2">{loadingShelfStock ? '…' : selectedShelfStock.units}</span>
                <span className="text-muted-foreground ml-3">Set:</span>
                <span className="font-semibold ml-2">{loadingShelfStock ? '…' : selectedShelfStock.sets}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant={mode === 'giris' ? 'default' : 'outline'}
            className={cn(
              'h-9 px-3',
              mode === 'giris'
                ? 'bg-success hover:bg-success/90 text-success-foreground'
                : 'text-success border-success/30 hover:bg-success/10 hover:text-success'
            )}
            onClick={() => handleModeChange('giris')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Giriş
          </Button>
          <Button
            size="sm"
            variant={mode === 'cikis' ? 'default' : 'outline'}
            className={cn(
              'h-9 px-3',
              mode === 'cikis'
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                : 'text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive'
            )}
            onClick={() => handleModeChange('cikis')}
          >
            <Minus className="w-4 h-4 mr-1" />
            Çıkış
          </Button>
        </div>
      </div>

      {mode !== 'idle' && (
        <div className="animate-slide-up space-y-3 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn('w-2 h-2 rounded-full', mode === 'giris' ? 'bg-success' : 'bg-destructive')} />
            <span className="text-sm font-medium">
              {mode === 'giris' ? 'Stok Girişi' : 'Stok Çıkışı'}
            </span>
          </div>

          {/* Shelf Selector (required) */}
          {showShelfSelector && (
            <ShelfSelector
              shelves={shelves}
              selectedShelfId={selectedShelfId}
              onSelect={handleShelfSelect}
              onAddNew={addShelf}
              label="Raf *"
              placeholder="Raf seçin..."
              required
            />
          )}

          {/* Quantity Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="adet-input" className="text-xs">
                {mode === 'giris' ? '+ Adet' : '− Adet'}
              </Label>
              <Input
                id="adet-input"
                type="number"
                min="0"
                max={mode === 'cikis' ? selectedShelfStock.units : undefined}
                value={adetInput || ''}
                onChange={(e) => setAdetInput(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="h-9"
              />
              {mode === 'cikis' && (
                <p className="text-xs text-muted-foreground">
                  Maks (Seçili Raf): {selectedShelfStock.units}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="set-input" className="text-xs">
                {mode === 'giris' ? '+ Set' : '− Set'}
              </Label>
              <Input
                id="set-input"
                type="number"
                min="0"
                max={mode === 'cikis' ? selectedShelfStock.sets : undefined}
                value={setInput || ''}
                onChange={(e) => setSetInput(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="h-9"
              />
              {mode === 'cikis' && (
                <p className="text-xs text-muted-foreground">
                  Maks (Seçili Raf): {selectedShelfStock.sets}
                </p>
              )}
            </div>
          </div>

          {/* New Values Preview */}
          {(adetInput > 0 || setInput > 0) && (
            <div className="flex items-center gap-4 p-2 rounded bg-muted/30 text-sm">
              <span className="text-muted-foreground">Yeni değerler (toplam):</span>
              <span className={cn('font-semibold', mode === 'giris' ? 'text-success' : 'text-destructive')}>
                {newAdet} adet
              </span>
              <span className={cn('font-semibold', mode === 'giris' ? 'text-success' : 'text-destructive')}>
                {newSet} set
              </span>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note-input" className="text-xs">Not (opsiyonel)</Label>
            <Textarea
              id="note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="İşlem açıklaması..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              İptal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!isValid() || isSubmitting}
              onClick={handleSubmit}
              className={cn(mode === 'giris' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90')}
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}