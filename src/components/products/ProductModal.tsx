import { useState, useEffect } from 'react';
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
import { ShelfSelector } from '@/components/shelves/ShelfSelector';
import { useShelves, Shelf } from '@/hooks/useShelves';
import { QuickStockInput } from '@/components/stock/QuickStockInput';
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  product?: Product | null;
  initialBarcode?: string;
  onStockUpdated?: () => void;
}

export function ProductModal({ isOpen, onClose, onSave, product, initialBarcode, onStockUpdated }: ProductModalProps) {
  const { shelves, addShelf } = useShelves();
  const [selectedShelfId, setSelectedShelfId] = useState<string | undefined>();
  
  const [formData, setFormData] = useState({
    urunKodu: '',
    urunAdi: '',
    rafKonum: '',
    barkod: '',
    mevcutStok: 0,
    setStok: 0,
    minStok: 5,
    not: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        urunKodu: product.urunKodu,
        urunAdi: product.urunAdi,
        rafKonum: product.rafKonum,
        barkod: product.barkod || '',
        mevcutStok: product.mevcutStok,
        setStok: product.setStok || 0,
        minStok: product.minStok,
        not: product.not || '',
      });
      // Find matching shelf
      const matchingShelf = shelves.find(s => s.name === product.rafKonum);
      setSelectedShelfId(matchingShelf?.id);
    } else {
      setFormData({
        urunKodu: '',
        urunAdi: '',
        rafKonum: '',
        barkod: initialBarcode || '',
        mevcutStok: 0,
        setStok: 0,
        minStok: 5,
        not: '',
      });
      setSelectedShelfId(undefined);
    }
  }, [product, isOpen, initialBarcode, shelves]);

  const handleShelfSelect = (shelf: Shelf) => {
    setSelectedShelfId(shelf.id);
    setFormData({ ...formData, rafKonum: shelf.name });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      acilisStok: product?.acilisStok || 0,
      toplamGiris: product?.toplamGiris || 0,
      toplamCikis: product?.toplamCikis || 0,
      uyari: formData.mevcutStok < formData.minStok,
      sonIslemTarihi: new Date().toISOString().split('T')[0],
    };

    if (product) {
      onSave({ ...productData, id: product.id });
    } else {
      onSave(productData);
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="urunKodu">Ürün Kodu *</Label>
              <Input
                id="urunKodu"
                value={formData.urunKodu}
                onChange={(e) => setFormData({ ...formData, urunKodu: e.target.value })}
                placeholder="Örn: 85426"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barkod">Barkod</Label>
              <Input
                id="barkod"
                value={formData.barkod}
                onChange={(e) => setFormData({ ...formData, barkod: e.target.value })}
                placeholder="Opsiyonel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urunAdi">Ürün Adı *</Label>
            <Input
              id="urunAdi"
              value={formData.urunAdi}
              onChange={(e) => setFormData({ ...formData, urunAdi: e.target.value })}
              placeholder="Ürün adını girin"
              required
            />
          </div>

          {/* Shelf Selector */}
          <ShelfSelector
            shelves={shelves}
            selectedShelfId={selectedShelfId}
            selectedShelfName={formData.rafKonum}
            onSelect={handleShelfSelect}
            onAddNew={addShelf}
            label="Raf / Konum"
            placeholder="Raf seçin veya yeni ekleyin..."
            required
          />

          {/* Quick Stock Input for existing products */}
          {product && (
            <div className="border-t border-b border-border py-4 my-2">
              <Label className="text-sm font-medium mb-2 block">Hızlı Stok Hareketi</Label>
              <QuickStockInput 
                product={product} 
                onSuccess={onStockUpdated}
                showShelfSelector={false}
              />
            </div>
          )}

          {/* For new products, show initial stock inputs */}
          {!product && (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mevcutStok">Başlangıç Stok (Adet)</Label>
                <Input
                  id="mevcutStok"
                  type="number"
                  min="0"
                  value={formData.mevcutStok}
                  onChange={(e) => setFormData({ ...formData, mevcutStok: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setStok">Başlangıç Set</Label>
                <Input
                  id="setStok"
                  type="number"
                  min="0"
                  value={formData.setStok}
                  onChange={(e) => setFormData({ ...formData, setStok: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStok">Minimum Stok</Label>
                <Input
                  id="minStok"
                  type="number"
                  min="0"
                  value={formData.minStok}
                  onChange={(e) => setFormData({ ...formData, minStok: parseInt(e.target.value) || 0 })}
                  placeholder="5"
                />
              </div>
            </div>
          )}

          {/* Min stock for existing products */}
          {product && (
            <div className="w-1/3">
              <div className="space-y-2">
                <Label htmlFor="minStok">Minimum Stok</Label>
                <Input
                  id="minStok"
                  type="number"
                  min="0"
                  value={formData.minStok}
                  onChange={(e) => setFormData({ ...formData, minStok: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="not">Not</Label>
            <Textarea
              id="not"
              value={formData.not}
              onChange={(e) => setFormData({ ...formData, not: e.target.value })}
              placeholder="Ek notlar..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" className="gradient-accent border-0">
              {product ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
