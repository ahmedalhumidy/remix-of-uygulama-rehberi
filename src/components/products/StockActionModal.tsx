import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Product } from '@/types/stock';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { QuickStockInput } from '@/components/stock/QuickStockInput';

interface StockActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: Product | null;
  actionType: 'giris' | 'cikis';
}

export function StockActionModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  product, 
  actionType 
}: StockActionModalProps) {
  const isGiris = actionType === 'giris';

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
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
            {product.urunAdi}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-2">
          <QuickStockInput 
            product={product}
            onSuccess={handleSuccess}
            showShelfSelector={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
