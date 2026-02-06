import { useState } from 'react';
import {
  Package, X, ScanBarcode, MapPin, Hash, Tag, Layers,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShelfSelector } from '@/components/shelves/ShelfSelector';
import { useShelves, Shelf } from '@/hooks/useShelves';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Product } from '@/types/stock';
import { cn } from '@/lib/utils';

interface QuickAddProductFormProps {
  barcode: string;
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
}

type Step = 'form' | 'saving' | 'success' | 'error';

export function QuickAddProductForm({
  barcode,
  isOpen,
  onClose,
  onProductCreated,
}: QuickAddProductFormProps) {
  const { shelves, addShelf } = useShelves();
  const [selectedShelfId, setSelectedShelfId] = useState<string | undefined>();
  const [step, setStep] = useState<Step>('form');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    urunKodu: '',
    urunAdi: '',
    rafKonum: '',
    mevcutStok: 0,
    setStok: 0,
    minStok: 5,
  });

  const handleShelfSelect = (shelf: Shelf) => {
    setSelectedShelfId(shelf.id);
    setFormData((prev) => ({ ...prev, rafKonum: shelf.name }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.urunKodu.trim() || !formData.urunAdi.trim() || !formData.rafKonum.trim()) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    setStep('saving');

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          urun_kodu: formData.urunKodu.trim(),
          urun_adi: formData.urunAdi.trim(),
          raf_konum: formData.rafKonum.trim(),
          barkod: barcode,
          mevcut_stok: formData.mevcutStok,
          set_stok: formData.setStok,
          min_stok: formData.minStok,
          acilis_stok: formData.mevcutStok,
          uyari: formData.mevcutStok < formData.minStok,
        })
        .select()
        .single();

      if (error) throw error;

      const newProduct: Product = {
        id: data.id,
        urunKodu: data.urun_kodu,
        urunAdi: data.urun_adi,
        rafKonum: data.raf_konum,
        barkod: data.barkod || undefined,
        acilisStok: data.acilis_stok,
        toplamGiris: data.toplam_giris,
        toplamCikis: data.toplam_cikis,
        mevcutStok: data.mevcut_stok,
        setStok: data.set_stok,
        minStok: data.min_stok,
        uyari: data.uyari,
        sonIslemTarihi: data.son_islem_tarihi || undefined,
      };

      setStep('success');
      toast.success(`✓ ${newProduct.urunAdi} ürünü eklendi`);

      setTimeout(() => {
        onProductCreated(newProduct);
      }, 800);
    } catch (err: any) {
      console.error('Error creating product:', err);
      setErrorMsg(err.message || 'Ürün eklenirken hata oluştu');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Hızlı Ürün Ekle</h3>
              <p className="text-xs text-muted-foreground">Yeni barkod tespit edildi</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Barcode Display */}
        <div className="mx-5 mt-4 flex items-center gap-3 rounded-xl bg-muted/50 border border-border px-4 py-3">
          <ScanBarcode className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground block">Barkod</span>
            <span className="font-mono font-semibold text-foreground text-sm">{barcode}</span>
          </div>
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
            Yeni
          </Badge>
        </div>

        {/* Form / States */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Product Code */}
            <div className="space-y-1.5">
              <Label htmlFor="qa-code" className="text-xs font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                Ürün Kodu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="qa-code"
                value={formData.urunKodu}
                onChange={(e) => setFormData((p) => ({ ...p, urunKodu: e.target.value }))}
                placeholder="Örn: 85426"
                className="h-10"
                required
                autoFocus
              />
            </div>

            {/* Product Name */}
            <div className="space-y-1.5">
              <Label htmlFor="qa-name" className="text-xs font-medium flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                Ürün Adı <span className="text-destructive">*</span>
              </Label>
              <Input
                id="qa-name"
                value={formData.urunAdi}
                onChange={(e) => setFormData((p) => ({ ...p, urunAdi: e.target.value }))}
                placeholder="Ürün adını girin"
                className="h-10"
                required
              />
            </div>

            {/* Shelf */}
            <div className="space-y-1.5">
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
            </div>

            {/* Stock Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qa-stok" className="text-xs font-medium flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  Stok
                </Label>
                <Input
                  id="qa-stok"
                  type="number"
                  min={0}
                  value={formData.mevcutStok}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, mevcutStok: parseInt(e.target.value) || 0 }))
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qa-set" className="text-xs font-medium">
                  Set
                </Label>
                <Input
                  id="qa-set"
                  type="number"
                  min={0}
                  value={formData.setStok}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, setStok: parseInt(e.target.value) || 0 }))
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qa-min" className="text-xs font-medium">
                  Min Stok
                </Label>
                <Input
                  id="qa-min"
                  type="number"
                  min={0}
                  value={formData.minStok}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, minStok: parseInt(e.target.value) || 0 }))
                  }
                  className="h-10"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={onClose}
              >
                İptal
              </Button>
              <Button type="submit" className="flex-1 h-11 gap-2">
                <Package className="w-4 h-4" />
                Ekle & Devam Et
              </Button>
            </div>
          </form>
        )}

        {step === 'saving' && (
          <div className="flex flex-col items-center justify-center py-16 px-5">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Ürün ekleniyor...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-16 px-5">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <p className="text-sm font-semibold text-foreground">Ürün başarıyla eklendi!</p>
            <p className="text-xs text-muted-foreground mt-1">Tarama listesine ekleniyor…</p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 px-5">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Hata oluştu</p>
            <p className="text-xs text-muted-foreground text-center mb-4">{errorMsg}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Kapat
              </Button>
              <Button size="sm" onClick={() => setStep('form')}>
                Tekrar Dene
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
