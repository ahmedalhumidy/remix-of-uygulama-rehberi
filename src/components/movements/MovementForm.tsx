import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, User, Calendar, Clock, Package, FileText, Scan, Search } from 'lucide-react';
import { Product } from '@/types/stock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { toast } from 'sonner';

interface MovementFormProps {
  products: Product[];
  onSubmit: (data: {
    productId: string;
    type: 'giris' | 'cikis';
    quantity: number;
    date: string;
    time: string;
    handledBy: string;
    note?: string;
  }) => void;
}

const staffMembers = [
  'Ahmet Yılmaz',
  'Mehmet Demir', 
  'Fatma Kaya',
  'Ali Öztürk',
  'Ayşe Çelik',
];

export function MovementForm({ products, onSubmit }: MovementFormProps) {
  const [type, setType] = useState<'giris' | 'cikis'>('giris');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [handledBy, setHandledBy] = useState('');
  const [note, setNote] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const selectedProduct = products.find(p => p.id === productId);

  // Filter products based on search
  const filteredProducts = products.filter(p => {
    const query = productSearch.toLowerCase();
    return (
      p.urunAdi.toLowerCase().includes(query) ||
      p.urunKodu.toLowerCase().includes(query) ||
      p.barkod?.toLowerCase().includes(query)
    );
  });

  const handleBarcodeScan = (code: string) => {
    const product = products.find(p => p.barkod === code || p.urunKodu === code);
    if (product) {
      setProductId(product.id);
      setShowScanner(false);
      toast.success(`Ürün bulundu: ${product.urunAdi}`, {
        description: `Kod: ${product.urunKodu}`,
      });
    } else {
      toast.error('Ürün bulunamadı', {
        description: `Barkod: ${code}`,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !handledBy) return;

    onSubmit({
      productId,
      type,
      quantity,
      date,
      time,
      handledBy,
      note: note || undefined,
    });

    // Reset form
    setProductId('');
    setQuantity(1);
    setNote('');
    setProductSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="stat-card space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className={cn(
          'p-3 rounded-xl',
          type === 'giris' ? 'bg-success/10' : 'bg-destructive/10'
        )}>
          {type === 'giris' ? (
            <ArrowUpRight className="w-6 h-6 text-success" />
          ) : (
            <ArrowDownRight className="w-6 h-6 text-destructive" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground">
            Yeni {type === 'giris' ? 'Stok Girişi' : 'Stok Çıkışı'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Hareket bilgilerini doldurun
          </p>
        </div>
      </div>

      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setType('giris')}
          className={cn(
            'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
            type === 'giris' 
              ? 'border-success bg-success/10 text-success' 
              : 'border-border hover:border-success/50'
          )}
        >
          <ArrowUpRight className="w-5 h-5" />
          <span className="font-medium">Giriş</span>
        </button>
        <button
          type="button"
          onClick={() => setType('cikis')}
          className={cn(
            'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
            type === 'cikis' 
              ? 'border-destructive bg-destructive/10 text-destructive' 
              : 'border-border hover:border-destructive/50'
          )}
        >
          <ArrowDownRight className="w-5 h-5" />
          <span className="font-medium">Çıkış</span>
        </button>
      </div>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowScanner(false)}
      />

      {/* Product Selection with Search and Barcode */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          Ürün Seçin *
        </Label>
        
        {/* Barcode Scan Button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowScanner(!showScanner)}
          className={cn(
            'w-full flex items-center justify-center gap-2 border-2 border-dashed',
            showScanner ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          )}
        >
          <Scan className="w-5 h-5" />
          {showScanner ? 'Tarayıcıyı Kapat' : 'Barkod ile Tara'}
        </Button>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ürün adı veya kodu ile ara..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Product Dropdown */}
        <Select value={productId} onValueChange={(value) => {
          setProductId(value);
          setProductSearch('');
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Ürün seçin..." />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {filteredProducts.map(product => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1">
                    <div className="font-medium">{product.urunAdi}</div>
                    <div className="text-xs text-muted-foreground">
                      Kod: {product.urunKodu} {product.barkod && `| Barkod: ${product.barkod}`}
                    </div>
                  </div>
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded',
                    product.mevcutStok <= product.minStok 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-success/10 text-success'
                  )}>
                    {product.mevcutStok}
                  </span>
                </div>
              </SelectItem>
            ))}
            {filteredProducts.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Ürün bulunamadı
              </div>
            )}
          </SelectContent>
        </Select>

        {/* Selected Product Info */}
        {selectedProduct && (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{selectedProduct.urunAdi}</p>
                <p className="text-xs text-muted-foreground">
                  Kod: {selectedProduct.urunKodu} | Konum: {selectedProduct.rafKonum}
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-lg font-bold',
                  selectedProduct.mevcutStok <= selectedProduct.minStok ? 'text-destructive' : 'text-success'
                )}>
                  {selectedProduct.mevcutStok}
                </p>
                <p className="text-xs text-muted-foreground">mevcut</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Miktar *</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          max={type === 'cikis' && selectedProduct ? selectedProduct.mevcutStok : undefined}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          required
        />
        {type === 'cikis' && selectedProduct && (
          <p className="text-xs text-muted-foreground">
            Maksimum: {selectedProduct.mevcutStok}
          </p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Tarih *
          </Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Saat *
          </Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Handled By */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {type === 'giris' ? 'Teslim Alan' : 'Teslim Eden'} *
        </Label>
        <Select value={handledBy} onValueChange={setHandledBy}>
          <SelectTrigger>
            <SelectValue placeholder="Personel seçin..." />
          </SelectTrigger>
          <SelectContent>
            {staffMembers.map(staff => (
              <SelectItem key={staff} value={staff}>
                {staff}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Not
        </Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="İşlem açıklaması..."
          rows={2}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!productId || !handledBy}
        className={cn(
          'w-full border-0',
          type === 'giris' ? 'gradient-success' : 'bg-destructive hover:bg-destructive/90'
        )}
      >
        {type === 'giris' ? 'Stok Girişi Kaydet' : 'Stok Çıkışı Kaydet'}
      </Button>
    </form>
  );
}
