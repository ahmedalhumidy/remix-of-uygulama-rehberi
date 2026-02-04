import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Product } from '@/types/stock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ShelfSelector } from '@/components/shelves/ShelfSelector';
import { useShelves, Shelf } from '@/hooks/useShelves';

interface StockActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, setQuantity: number, note: string, shelfId?: string) => void;
  product: Product | null;
  actionType: 'giris' | 'cikis';
}

export function StockActionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  product, 
  actionType 
}: StockActionModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [setQty, setSetQty] = useState(0);
  const [note, setNote] = useState('');
  const [selectedShelfId, setSelectedShelfId] = useState<string | undefined>();
  
  const { shelves, addShelf } = useShelves();
  const isGiris = actionType === 'giris';

  // Auto-select shelf when product is selected
  useEffect(() => {
    if (product && product.rafKonum) {
      const matchingShelf = shelves.find(s => s.name === product.rafKonum);
      if (matchingShelf) {
        setSelectedShelfId(matchingShelf.id);
      }
    }
  }, [product, shelves]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(quantity, setQty, note, selectedShelfId);
    setQuantity(1);
    setSetQty(0);
    setNote('');
    setSelectedShelfId(undefined);
    onClose();
  };

  const handleShelfSelect = (shelf: Shelf) => {
    setSelectedShelfId(shelf.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn(
              'p-2 rounded-lg',
              isGiris ? 'bg-success/10' : 'bg-destructive/10'
            )}>
              {isGiris ? (
                <ArrowUpRight className="w-5 h-5 text-success" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-destructive" />
              )}
            </div>
            Stok {isGiris ? 'Girişi' : 'Çıkışı'}
          </DialogTitle>
        </DialogHeader>
        
        {product && (
          <div className="py-3 px-4 rounded-lg bg-muted/50 mb-4">
            <p className="font-medium text-foreground">{product.urunAdi}</p>
            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
              <span>
                Mevcut Stok: <span className="font-semibold text-foreground">{product.mevcutStok}</span>
              </span>
              <span>
                Set: <span className="font-semibold text-foreground">{product.setStok}</span>
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shelf Selection */}
          <ShelfSelector
            shelves={shelves}
            selectedShelfId={selectedShelfId}
            onSelect={handleShelfSelect}
            onAddNew={addShelf}
            label={isGiris ? 'Giriş Yapılacak Raf' : 'Çıkış Yapılacak Raf'}
            placeholder="Raf seçin..."
          />

          {/* Quantity Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Adet *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                max={!isGiris && product ? product.mevcutStok : undefined}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
              {!isGiris && product && (
                <p className="text-xs text-muted-foreground">
                  Maks: {product.mevcutStok}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="setQty">Set</Label>
              <Input
                id="setQty"
                type="number"
                min="0"
                max={!isGiris && product ? product.setStok : undefined}
                value={setQty}
                onChange={(e) => setSetQty(parseInt(e.target.value) || 0)}
              />
              {!isGiris && product && (
                <p className="text-xs text-muted-foreground">
                  Maks: {product.setStok}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Not</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="İşlem açıklaması..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={quantity === 0 && setQty === 0}
              className={cn(
                'border-0',
                isGiris ? 'gradient-success' : 'bg-destructive hover:bg-destructive/90'
              )}
            >
              {isGiris ? 'Giriş Yap' : 'Çıkış Yap'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
