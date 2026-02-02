import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, User, Calendar, Clock, Package, FileText } from 'lucide-react';
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

  const selectedProduct = products.find(p => p.id === productId);

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

      {/* Product Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          Ürün Seçin *
        </Label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger>
            <SelectValue placeholder="Ürün seçin..." />
          </SelectTrigger>
          <SelectContent>
            {products.map(product => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center justify-between gap-4">
                  <span>{product.urunAdi}</span>
                  <span className="text-muted-foreground text-xs">
                    Stok: {product.mevcutStok}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProduct && (
          <p className="text-xs text-muted-foreground">
            Mevcut Stok: <span className="font-semibold">{selectedProduct.mevcutStok}</span> | 
            Konum: <span className="font-semibold">{selectedProduct.rafKonum}</span>
          </p>
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
