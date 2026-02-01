import { useState } from 'react';
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

interface StockActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, note: string) => void;
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
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(quantity, note);
    setQuantity(1);
    setNote('');
    onClose();
  };

  const isGiris = actionType === 'giris';

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
            <p className="text-sm text-muted-foreground">
              Mevcut Stok: <span className="font-semibold">{product.mevcutStok}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Miktar *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={!isGiris && product ? product.mevcutStok : undefined}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
            {!isGiris && product && (
              <p className="text-xs text-muted-foreground">
                Maksimum: {product.mevcutStok}
              </p>
            )}
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
